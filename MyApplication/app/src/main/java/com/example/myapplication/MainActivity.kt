package com.example.myapplication

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.myapplication.databinding.ActivityMainBinding
import com.example.myapplication.databinding.LayoutProgressDialogBinding
import com.google.gson.Gson
import com.google.gson.JsonObject
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity(), QRScannerDialogFragment.QRScannerListener {

    private lateinit var binding: ActivityMainBinding
    private val CAMERA_PERMISSION_CODE = 101
    
    // Supabase configuration
    private val SUPABASE_URL = "https://raypwndyjclstbqxrahm.supabase.co"
    private val SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheXB3bmR5amNsc3RicXhyYWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMTM5ODEsImV4cCI6MjA5Njg4OTk4MX0.qWk2I-C50KziSAaNogrjQQuGQI3euErWpYgvzqfRj_Y"

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val mainHandler = Handler(Looper.getMainLooper())
    private var progressDialog: AlertDialog? = null
    private var lastScannedQrDetails: Map<String, String>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Setup premium button animations and clicks
        setupButtonEffects()
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun setupButtonEffects() {
        val button = binding.btnStartScan

        // Custom touch listener for smooth scale-down scale-up press animation
        button.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    v.animate().scaleX(0.96f).scaleY(0.96f).setDuration(100).start()
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    v.animate().scaleX(1.0f).scaleY(1.0f).setDuration(100).start()
                    if (event.action == MotionEvent.ACTION_UP) {
                        button.performClick()
                    }
                }
            }
            true
        }

        button.setOnClickListener {
            checkAndStartScanner()
        }
    }

    private fun checkAndStartScanner() {
        if (checkPermission()) {
            showScannerDialog()
        } else {
            requestPermission()
        }
    }

    private fun checkPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.CAMERA),
            CAMERA_PERMISSION_CODE
        )
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                showScannerDialog()
            } else {
                Toast.makeText(
                    this,
                    "Camera permission is required to scan tickets",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun showScannerDialog() {
        val scannerDialog = QRScannerDialogFragment()
        scannerDialog.setScannerListener(this)
        scannerDialog.show(supportFragmentManager, "QRScannerDialog")
    }

    private fun parsePipeFormattedQr(qrData: String): Map<String, String>? {
        val trimmed = qrData.trim()
        if (trimmed.contains("BOOKING:") && trimmed.contains("|")) {
            val map = mutableMapOf<String, String>()
            val parts = trimmed.split("|")
            for (part in parts) {
                val kv = part.split(":", limit = 2)
                if (kv.size == 2) {
                    map[kv[0].trim().uppercase()] = kv[1].trim()
                }
            }
            if (map.containsKey("BOOKING")) {
                return map
            }
        }
        return null
    }

    private fun showLocalQrDetails(qrDetails: Map<String, String>, note: String) {
        val event = qrDetails["EVENT"] ?: "—"
        val seats = qrDetails["SEATS"] ?: "—"
        val venue = qrDetails["VENUE"] ?: "—"
        val date = qrDetails["DATE"] ?: "—"
        val amount = qrDetails["AMOUNT"] ?: "—"
        val qrStatus = qrDetails["STATUS"] ?: "PENDING_VERIFICATION"

        val cleanPrice = amount.replace("INR", "").replace("₹", "").trim()
        
        val status: String
        val reason: String
        
        when (qrStatus.uppercase()) {
            "APPROVED", "VALID", "SUCCESS" -> {
                status = "approved"
                reason = if (note.isNotBlank()) note else ""
            }
            "PENDING_VERIFICATION", "PENDING" -> {
                status = "pending"
                reason = "This booking exists in local ticket data but payment is awaiting admin confirmation." + 
                        if (note.isNotBlank()) "\n\n($note)" else ""
            }
            else -> {
                status = "denied"
                reason = "Status in local ticket data: $qrStatus" + 
                        if (note.isNotBlank()) "\n\n($note)" else ""
            }
        }

        showResultDialog(
            status = status,
            name = "Ticket Holder",
            seminar = event,
            venue = "$venue\n$date",
            seats = seats,
            price = cleanPrice,
            reason = reason
        )
    }

    // Callback when QR code is decoded
    override fun onQRScanned(data: String) {
        val pipeMap = parsePipeFormattedQr(data)
        val bookingId: String
        
        if (pipeMap != null) {
            lastScannedQrDetails = pipeMap
            bookingId = pipeMap["BOOKING"] ?: ""
        } else {
            lastScannedQrDetails = null
            bookingId = extractBookingId(data)
        }

        if (bookingId.isBlank()) {
            showResultDialog(
                status = "error",
                name = "—",
                seminar = "—",
                venue = "—",
                seats = "—",
                price = "—",
                reason = "This QR code does not contain a valid booking reference.\nPlease scan a valid Success Team ticket."
            )
            return
        }

        // Show centered premium loader
        showLoading(true)

        // Query database in background thread
        verifyBooking(bookingId)
    }

    private fun extractBookingId(qrData: String): String {
        val trimmed = qrData.trim()

        // Try JSON
        if (trimmed.startsWith("{")) {
            return try {
                val json = Gson().fromJson(trimmed, JsonObject::class.java)
                val id = json.get("bookingId")?.asString
                    ?: json.get("id")?.asString
                    ?: json.get("booking_id")?.asString
                    ?: ""
                id.trim()
            } catch (e: Exception) {
                ""
            }
        }

        // Try pipe separated
        if (trimmed.contains("BOOKING:") && trimmed.contains("|")) {
            val parts = trimmed.split("|")
            for (part in parts) {
                val kv = part.split(":", limit = 2)
                if (kv.size == 2 && kv[0].trim().equals("BOOKING", ignoreCase = true)) {
                    return kv[1].trim()
                }
            }
        }

        // Plain string format check
        if (trimmed.matches(Regex("EVT-\\d{4}-[A-Z0-9]{6,12}"))) {
            return trimmed
        }

        // Fallback for non-empty simple string without spaces
        return if (trimmed.isNotBlank() && !trimmed.contains(" ")) trimmed else ""
    }

    private fun verifyBooking(bookingId: String) {
        Thread {
            try {
                // PostgREST REST API call
                val url = "$SUPABASE_URL/rest/v1/bookings?id=eq.${bookingId}&select=*,users(name,email,phone)"
                
                val request = Request.Builder()
                    .url(url)
                    .addHeader("apikey", SUPABASE_ANON_KEY)
                    .addHeader("Authorization", "Bearer $SUPABASE_ANON_KEY")
                    .addHeader("Content-Type", "application/json")
                    .get()
                    .build()

                val response = okHttpClient.newCall(request).execute()
                val body = response.body?.string() ?: "[]"

                mainHandler.post {
                    showLoading(false)
                    parseResultAndShow(body, bookingId)
                }

            } catch (e: IOException) {
                mainHandler.post {
                    showLoading(false)
                    val qrDetails = lastScannedQrDetails
                    if (qrDetails != null) {
                        showLocalQrDetails(qrDetails, "Offline verification: showing ticket details")
                    } else {
                        showResultDialog(
                            status = "error",
                            name = "—",
                            seminar = "—",
                            venue = "—",
                            seats = "—",
                            price = "—",
                            reason = "Network error: Could not reach verification server. Please check your internet connection."
                        )
                    }
                }
            } catch (e: Exception) {
                mainHandler.post {
                    showLoading(false)
                    val qrDetails = lastScannedQrDetails
                    if (qrDetails != null) {
                        showLocalQrDetails(qrDetails, "Verification error: showing ticket details")
                    } else {
                        showResultDialog(
                            status = "error",
                            name = "—",
                            seminar = "—",
                            venue = "—",
                            seats = "—",
                            price = "—",
                            reason = "An unexpected error occurred: ${e.message}"
                        )
                    }
                }
            }
        }.start()
    }

    private fun parseResultAndShow(jsonBody: String, bookingId: String) {
        try {
            val gson = Gson()
            val array = gson.fromJson(jsonBody, Array<JsonObject>::class.java)

            if (array == null || array.isEmpty()) {
                val qrDetails = lastScannedQrDetails
                if (qrDetails != null) {
                    showLocalQrDetails(qrDetails, "")
                } else {
                    showResultDialog(
                        status = "error",
                        name = "—",
                        seminar = "—",
                        venue = "—",
                        seats = "—",
                        price = "—",
                        reason = "Booking ID \"$bookingId\" was not found in the system.\nThe ticket may be expired or fake."
                    )
                }
                return
            }

            val booking = array[0]
            val status = booking.get("status")?.asString ?: "unknown"

            // Get nested user details
            val usersEl = booking.get("users")
            val userName: String = if (usersEl != null && !usersEl.isJsonNull) {
                if (usersEl.isJsonArray) {
                    val usersArr = usersEl.asJsonArray
                    val user = if (usersArr.size() > 0) usersArr[0].asJsonObject else JsonObject()
                    user.get("name")?.asString ?: "Unknown"
                } else {
                    val user = usersEl.asJsonObject
                    user.get("name")?.asString ?: "Unknown"
                }
            } else {
                "Unknown"
            }

            val seminarName = booking.get("seminar_name")
                ?: booking.get("bus_name")
                ?: gson.toJsonTree("—")
            val venue = booking.get("source")?.asString ?: "—"
            val seminar = booking.get("destination")?.asString ?: "—"
            val date = booking.get("date")?.asString ?: "—"
            val time = booking.get("time")?.asString ?: "—"
            val totalPrice = booking.get("total_price")?.asString ?: "—"

            val seatsEl = booking.get("seats")
            val seats = if (seatsEl != null && seatsEl.isJsonArray) {
                val arr = seatsEl.asJsonArray
                (0 until arr.size()).map { arr[it].asString }.joinToString(", ")
            } else {
                seatsEl?.asString ?: "—"
            }

            when (status) {
                "approved" -> {
                    showResultDialog(
                        status = "approved",
                        name = userName,
                        seminar = seminarName.asString,
                        venue = "$venue → $seminar\n$date  •  $time",
                        seats = seats,
                        price = totalPrice,
                        reason = ""
                    )
                }
                "pending" -> {
                    showResultDialog(
                        status = "pending",
                        name = userName,
                        seminar = seminarName.asString,
                        venue = "$venue → $seminar\n$date  •  $time",
                        seats = seats,
                        price = totalPrice,
                        reason = "This booking exists but payment is awaiting admin confirmation before entry is allowed."
                    )
                }
                "denied" -> {
                    showResultDialog(
                        status = "denied",
                        name = userName,
                        seminar = seminarName.asString,
                        venue = "$venue → $seminar\n$date  •  $time",
                        seats = seats,
                        price = totalPrice,
                        reason = "This booking was explicitly rejected/denied by the admin."
                    )
                }
                else -> {
                    showResultDialog(
                        status = "error",
                        name = userName,
                        seminar = seminarName.asString,
                        venue = "$venue → $seminar\n$date  •  $time",
                        seats = seats,
                        price = totalPrice,
                        reason = "Status \"$status\" is unrecognized. Entry not permitted."
                    )
                }
            }

        } catch (e: Exception) {
            val qrDetails = lastScannedQrDetails
            if (qrDetails != null) {
                showLocalQrDetails(qrDetails, "Parse error on server response: showing local details")
            } else {
                showResultDialog(
                    status = "error",
                    name = "—",
                    seminar = "—",
                    venue = "—",
                    seats = "—",
                    price = "—",
                    reason = "Error parsing response: ${e.message}"
                )
            }
        }
    }

    private fun showResultDialog(
        status: String,
        name: String,
        seminar: String,
        venue: String,
        seats: String,
        price: String,
        reason: String
    ) {
        val resultDialog = ValidationResultDialogFragment.newInstance(
            status, name, seminar, venue, seats, price, reason
        )
        resultDialog.show(supportFragmentManager, "ValidationResultDialog")
    }

    private fun showLoading(visible: Boolean) {
        if (visible) {
            val progressBinding = LayoutProgressDialogBinding.inflate(layoutInflater)
            progressDialog = AlertDialog.Builder(this)
                .setView(progressBinding.root)
                .setCancelable(false)
                .create().apply {
                    window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
                    show()
                }
        } else {
            progressDialog?.dismiss()
            progressDialog = null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        progressDialog?.dismiss()
    }
}