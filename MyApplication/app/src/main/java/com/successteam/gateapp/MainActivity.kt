package com.successteam.gateapp

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
import com.successteam.gateapp.databinding.ActivityMainBinding
import com.successteam.gateapp.databinding.LayoutProgressDialogBinding
import com.google.gson.Gson
import com.google.gson.JsonObject
import okhttp3.OkHttpClient
import android.net.Uri
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

import android.util.Log
import com.google.gson.JsonArray

class MainActivity : AppCompatActivity(), QRScannerDialogFragment.QRScannerListener {

    private val TAG = "QR_VALIDATION"
    private lateinit var binding: ActivityMainBinding
    private val CAMERA_PERMISSION_CODE = 101

    // Supabase configuration
    private val SUPABASE_URL = "https://raypwndyjclstbqxrahm.supabase.co"
    private val SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheXB3bmR5amNsc3RicXhyYWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMTM5ODEsImV4cCI6MjA5Njg4OTk4MX0.qWk2I-C50KziSAaNogrjQQuGQI3euErWpYgvzqfRj_Y"

    // Reduced timeouts for quicker scan response
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()

    private val mainHandler = Handler(Looper.getMainLooper())
    private var progressDialog: AlertDialog? = null
    private var lastScannedQrDetails: Map<String, String>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setupButtonEffects()
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun setupButtonEffects() {
        val button = binding.btnStartScan
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
        if (checkPermission()) showScannerDialog() else requestPermission()
    }

    private fun checkPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED

    private fun requestPermission() {
        ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), CAMERA_PERMISSION_CODE)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                showScannerDialog()
            } else {
                Toast.makeText(this, "Camera permission is required to scan tickets", Toast.LENGTH_LONG).show()
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
        val hasNewFormat = trimmed.contains("BOOKING_ID:") && trimmed.contains("|")
        val hasLegacyFormat = trimmed.contains("BOOKING:") && trimmed.contains("|")
        if (hasNewFormat || hasLegacyFormat) {
            val map = mutableMapOf<String, String>()
            val parts = trimmed.split("|")
            for (part in parts) {
                val colonIdx = part.indexOf(":")
                if (colonIdx > 0) {
                    val key = part.substring(0, colonIdx).trim().uppercase()
                    val value = part.substring(colonIdx + 1).trim()
                    map[key] = value
                }
            }
            if (map.containsKey("BOOKING_ID") && !map.containsKey("BOOKING")) map["BOOKING"] = map["BOOKING_ID"]!!
            if (map.containsKey("EVENT_NAME") && !map.containsKey("EVENT"))    map["EVENT"] = map["EVENT_NAME"]!!
            if (map.containsKey("SEAT") && !map.containsKey("SEATS"))          map["SEATS"] = map["SEAT"]!!
            if (map.containsKey("ATTENDEE") && !map.containsKey("ATTENDEES"))  map["ATTENDEES"] = "Name=${map["ATTENDEE"]!!}"
            if (map.containsKey("BOOKING")) return map
        }
        return null
    }

    private fun formatDateTime(dateTimeStr: String): String {
        return try {
            if (dateTimeStr.contains("T")) {
                val datePart = dateTimeStr.substringBefore("T")
                val timePart = dateTimeStr.substringAfter("T")
                val cleanTime = when {
                    timePart.contains("+") -> timePart.substringBefore("+")
                    timePart.contains("Z") -> timePart.substringBefore("Z")
                    else -> timePart
                }
                val shortTime = if (cleanTime.length >= 5) cleanTime.substring(0, 5) else cleanTime
                "$datePart  •  $shortTime"
            } else {
                dateTimeStr
            }
        } catch (e: Exception) {
            dateTimeStr
        }
    }

    private fun showLocalQrDetails(qrDetails: Map<String, String>, note: String) {
        showResultDialog(TicketSnapshotFactory.fromQrDetails(qrDetails, emptySet(), note))
    }

    private fun parseUrlQr(qrData: String): Map<String, String>? {
        val trimmed = qrData.trim()
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.contains("/verify")) {
            try {
                val uri = Uri.parse(trimmed)
                val id = uri.getQueryParameter("id")
                val dataParam = uri.getQueryParameter("data")
                if (!id.isNullOrBlank()) {
                    val map = mutableMapOf<String, String>()
                    map["BOOKING"] = id
                    if (!dataParam.isNullOrBlank()) {
                        val decodedBytes = android.util.Base64.decode(dataParam, android.util.Base64.DEFAULT)
                        val decodedString = String(decodedBytes, Charsets.UTF_8)
                        val json = Gson().fromJson(decodedString, JsonObject::class.java)
                        val event  = json.get("event")?.asString ?: json.get("eventName")?.asString ?: "—"
                        val date   = json.get("date")?.asString ?: "—"
                        val time   = json.get("time")?.asString ?: "—"
                        val venue  = json.get("venue")?.asString ?: "—"
                        val amount = json.get("amount")?.asString ?: json.get("amountPaid")?.asString ?: json.get("totalPrice")?.asString ?: "—"
                        val status = json.get("status")?.asString ?: "PENDING_VERIFICATION"
                        val name   = json.get("name")?.asString ?: json.get("attendeeName")?.asString ?: "—"
                        val seatsEl = json.get("seats")
                        val seats = when {
                            seatsEl == null || seatsEl.isJsonNull -> "—"
                            seatsEl.isJsonArray -> {
                                val arr = seatsEl.asJsonArray
                                val list = mutableListOf<String>()
                                for (i in 0 until arr.size()) { list.add(arr[i].asString) }
                                list.joinToString(", ")
                            }
                            else -> seatsEl.asString
                        }
                        map["EVENT"] = event
                        map["DATE"]  = if (date != "—" && time != "—") "${date}T${time}" else date
                        map["VENUE"] = venue
                        map["AMOUNT"] = amount
                        map["STATUS"] = status
                        map["SEATS"]  = seats
                        map["ATTENDEES"] = "Name=$name"
                    }
                    return map
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        return null
    }

    // ── Already-entered detection ──────────────────────────────────────────────
    /**
     * Returns true if this booking has already had at least one attendee approved locally,
     * meaning the ticket was already scanned and entry was granted.
     */
    private fun isAlreadyEntered(bookingId: String): Boolean {
        if (bookingId.isBlank()) return false
        val prefs = getSharedPreferences("gate_attendee_approvals", MODE_PRIVATE)
        val raw = prefs.getString("approved_attendee_keys", "").orEmpty().trim()
        if (raw.isBlank()) return false
        return try {
            val json = com.google.gson.JsonParser.parseString(raw).asJsonObject
            val approvedSet = json.get(bookingId)
            approvedSet != null && !approvedSet.isJsonNull && approvedSet.asJsonArray.size() > 0
        } catch (_: Exception) {
            false
        }
    }

    private fun isBookingFullyCheckedInOffline(bookingId: String, qrDetails: Map<String, String>): Boolean {
        if (bookingId.isBlank()) return false
        val attendeesRaw = qrDetails["ATTENDEES"].orEmpty().trim()
        val directAttendee = qrDetails["ATTENDEE"].orEmpty().trim()
        if (attendeesRaw.isBlank() && directAttendee.isBlank()) return false

        val items = if (attendeesRaw.isNotBlank()) attendeesRaw.split(",") else listOf("Name=$directAttendee")
        val attendeeKeys = items.mapNotNull { item ->
            val cleaned = item.trim()
            if (cleaned.isBlank()) return@mapNotNull null
            val parts = cleaned.split("=", limit = 2)
            if (parts.size == 2) parts[0].trim() else "attendee-${items.indexOf(item) + 1}"
        }

        if (attendeeKeys.isEmpty()) return false

        val prefs = getSharedPreferences("gate_attendee_approvals", MODE_PRIVATE)
        val raw = prefs.getString("approved_attendee_keys", "").orEmpty().trim()
        if (raw.isBlank()) return false
        return try {
            val json = com.google.gson.JsonParser.parseString(raw).asJsonObject
            val approvedSet = json.getAsJsonArray(bookingId)
            if (approvedSet != null) {
                val approvedList = approvedSet.map { it.asString }
                attendeeKeys.all { approvedList.contains(it) }
            } else {
                false
            }
        } catch (_: Exception) {
            false
        }
    }

    private fun showAlreadyEnteredDialog(bookingId: String, qrDetails: Map<String, String>?) {
        val name    = qrDetails?.let { it["ATTENDEE"] ?: it["ATTENDEES"]?.substringAfter("=", "") ?: "" }?.trim() ?: ""
        val seminar = qrDetails?.get("EVENT") ?: qrDetails?.get("EVENT_NAME") ?: "—"
        val venue   = qrDetails?.get("VENUE") ?: "—"
        val seats   = qrDetails?.get("SEATS") ?: qrDetails?.get("SEAT") ?: "—"
        val price   = qrDetails?.get("AMOUNT") ?: "—"
        val date    = qrDetails?.get("DATE") ?: "—"
        showResultDialog(
            status    = "already_entered",
            name      = name.ifBlank { "Ticket Holder" },
            seminar   = seminar,
            venue     = venue,
            seats     = seats,
            price     = price,
            reason    = "This ticket has already been scanned and entry was granted. Re-entry is not permitted.",
            bookingId = bookingId,
            date      = date
        )
    }

    // ── QR Scan callback ───────────────────────────────────────────────────────
    override fun onQRScanned(data: String) {
        Log.d(TAG, "New QR Scanned. Clearing previous state.")
        lastScannedQrDetails = null

        val urlMap     = parseUrlQr(data)
        val hasLocalData = (urlMap != null && urlMap.containsKey("EVENT"))
        val pipeMap    = parsePipeFormattedQr(data)
        val resolvedMap = if (hasLocalData) urlMap else pipeMap
        val bookingId: String

        if (resolvedMap != null) {
            lastScannedQrDetails = resolvedMap
            bookingId = resolvedMap["BOOKING"] ?: ""
            Log.d(TAG, "Local data found for Booking ID: $bookingId. Status in QR: ${resolvedMap["STATUS"]}")

            // Check if already fully checked in offline
            if (bookingId.isNotBlank() && isBookingFullyCheckedInOffline(bookingId, resolvedMap)) {
                Log.d(TAG, "Booking $bookingId is fully checked in offline — showing already-entered result.")
                showAlreadyEnteredDialog(bookingId, resolvedMap)
                return
            }

            // Retrieve local approvals to set checkedIn statuses offline
            val prefs = getSharedPreferences("gate_attendee_approvals", MODE_PRIVATE)
            val raw = prefs.getString("approved_attendee_keys", "").orEmpty().trim()
            val approvedKeys = try {
                if (raw.isNotBlank()) {
                    val json = com.google.gson.JsonParser.parseString(raw).asJsonObject
                    val arr = json.getAsJsonArray(bookingId)
                    arr?.map { it.asString }?.toSet() ?: emptySet()
                } else emptySet()
            } catch (_: Exception) { emptySet() }

            // Show local ticket details instantly (fast!) then sync from server in background
            val snapshot = TicketSnapshotFactory.fromQrDetails(resolvedMap, approvedKeys, "")
            showResultDialog(snapshot)
            verifyBookingInBackground(bookingId)
        } else {
            bookingId = if (urlMap != null) urlMap["BOOKING"] ?: "" else extractBookingId(data)
            Log.d(TAG, "No local data. Extracted Booking ID: $bookingId")

            if (bookingId.isBlank()) {
                Log.w(TAG, "Invalid QR Code: No Booking ID found.")
                showResultDialog(
                    status  = "error",
                    name    = "—",
                    seminar = "—",
                    venue   = "—",
                    seats   = "—",
                    price   = "—",
                    reason  = "This QR code does not contain a valid booking reference.\nPlease scan a valid Success Team ticket."
                )
                return
            }

            // Check already-entered for ID-only codes too
            if (isAlreadyEntered(bookingId)) {
                Log.d(TAG, "Booking $bookingId (ID-only) is already entered.")
                showAlreadyEnteredDialog(bookingId, null)
                return
            }

            showLoading(true)
            verifyBooking(bookingId)
        }
    }

    private fun extractBookingId(qrData: String): String {
        val trimmed = qrData.trim()
        if (trimmed.startsWith("{")) {
            return try {
                val json = Gson().fromJson(trimmed, JsonObject::class.java)
                (json.get("bookingId")?.asString ?: json.get("id")?.asString ?: json.get("booking_id")?.asString ?: "").trim()
            } catch (e: Exception) { "" }
        }
        if (trimmed.contains("BOOKING_ID:") && trimmed.contains("|")) {
            val parts = trimmed.split("|")
            for (part in parts) {
                val colonIdx = part.indexOf(":")
                if (colonIdx > 0 && part.substring(0, colonIdx).trim().uppercase() == "BOOKING_ID") {
                    return part.substring(colonIdx + 1).trim()
                }
            }
        }
        if (trimmed.contains("BOOKING:") && trimmed.contains("|")) {
            val parts = trimmed.split("|")
            for (part in parts) {
                val kv = part.split(":", limit = 2)
                if (kv.size == 2 && kv[0].trim().equals("BOOKING", ignoreCase = true)) return kv[1].trim()
            }
        }
        if (trimmed.matches(Regex("EVT-\\d{4}-[A-Z0-9]{6,12}"))) return trimmed
        return if (trimmed.isNotBlank() && !trimmed.contains(" ")) trimmed else ""
    }

    private fun verifyBooking(bookingId: String) {
        Log.d(TAG, "Starting verification for Booking ID: $bookingId")
        Thread {
            try {
                val url = "http://10.0.2.2:3000/api/verify?id=$bookingId"
                val request = Request.Builder()
                    .url(url)
                    .get().build()
                val response = okHttpClient.newCall(request).execute()
                val body = response.body?.string() ?: "[]"
                Log.d(TAG, "Raw API Response for $bookingId: $body")
                mainHandler.post {
                    showLoading(false)
                    parseResultAndShow(body, bookingId)
                }
            } catch (e: IOException) {
                Log.e(TAG, "Network error during verification for $bookingId", e)
                mainHandler.post {
                    showLoading(false)
                    val qrDetails = lastScannedQrDetails
                    if (qrDetails != null) {
                        showLocalQrDetails(qrDetails, "Offline verification: showing ticket details")
                    } else {
                        showResultDialog(
                            status = "error", name = "—", seminar = "—", venue = "—",
                            seats = "—", price = "—",
                            reason = "Network error: Could not reach verification server. Please check your internet connection."
                        )
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected error during verification for $bookingId", e)
                mainHandler.post {
                    showLoading(false)
                    val qrDetails = lastScannedQrDetails
                    if (qrDetails != null) {
                        showLocalQrDetails(qrDetails, "Verification error: showing ticket details")
                    } else {
                        showResultDialog(
                            status = "error", name = "—", seminar = "—", venue = "—",
                            seats = "—", price = "—",
                            reason = "An unexpected error occurred: ${e.message}"
                        )
                    }
                }
            }
        }.start()
    }

    private fun verifyBookingInBackground(bookingId: String) {
        Log.d(TAG, "Starting background verification for Booking ID: $bookingId")
        Thread {
            try {
                val url = "http://10.0.2.2:3000/api/verify?id=$bookingId"
                val request = Request.Builder()
                    .url(url)
                    .get().build()
                val response = okHttpClient.newCall(request).execute()
                val body = response.body?.string() ?: "[]"
                Log.d(TAG, "Raw Background API Response for $bookingId: $body")
                mainHandler.post {
                    updateDialogWithServerResult(body, bookingId)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Background verification failed for $bookingId", e)
            }
        }.start()
    }

    private fun getFirstBookingFromResponse(jsonBody: String): JsonObject? {
        val trimmed = jsonBody.trim()
        if (trimmed.isEmpty()) return null
        return try {
            val gson = Gson()
            if (trimmed.startsWith("[")) {
                Log.d(TAG, "Response type: Array")
                val array = gson.fromJson(jsonBody, JsonArray::class.java)
                if (array.size() > 0) array[0].asJsonObject else null
            } else if (trimmed.startsWith("{")) {
                Log.d(TAG, "Response type: Object")
                gson.fromJson(jsonBody, JsonObject::class.java)
            } else {
                Log.w(TAG, "Unknown response format: ${trimmed.take(20)}...")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing JSON response", e)
            throw e
        }
    }

    private fun getBookingObject(jsonBody: String): JsonObject? {
        val rawObj = getFirstBookingFromResponse(jsonBody) ?: return null
        return if (rawObj.has("ticket") && rawObj.get("ticket").isJsonObject) {
            rawObj.getAsJsonObject("ticket")
        } else {
            rawObj
        }
    }

    private fun updateDialogWithServerResult(jsonBody: String, bookingId: String) {
        try {
            val booking = getBookingObject(jsonBody)
            if (booking != null) {
                val snapshot = TicketSnapshotFactory.fromBooking(booking, bookingId, lastScannedQrDetails)
                Log.d(TAG, "Background update - Booking: $bookingId, Status: ${snapshot.status}")
                val dialog = supportFragmentManager.findFragmentByTag("ValidationResultDialog") as? ValidationResultDialogFragment
                dialog?.updateTicketData(snapshot)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update dialog with background result for $bookingId", e)
        }
    }

    private fun parseResultAndShow(jsonBody: String, bookingId: String) {
        try {
            val booking = getBookingObject(jsonBody)
            if (booking == null) {
                Log.w(TAG, "No booking found for ID: $bookingId")
                val qrDetails = lastScannedQrDetails
                if (qrDetails != null) {
                    showLocalQrDetails(qrDetails, "")
                } else {
                    showResultDialog(
                        status = "error", name = "—", seminar = "—", venue = "—",
                        seats = "—", price = "—",
                        reason = "Booking ID \"$bookingId\" was not found in the system.\nThe ticket may be expired or fake."
                    )
                }
                return
            }
            val snapshot = TicketSnapshotFactory.fromBooking(booking, bookingId, lastScannedQrDetails)
            Log.d(TAG, "Validation Result for $bookingId: ${snapshot.status}")
            showResultDialog(snapshot)
        } catch (e: Exception) {
            Log.e(TAG, "Critical parsing error for $bookingId", e)
            showResultDialog(
                status = "error", name = "—", seminar = "—", venue = "—",
                seats = "—", price = "—",
                reason = "Verification Service Unavailable\n(Error parsing response)"
            )
        }
    }

    private fun showResultDialog(snapshot: GateTicketSnapshot) {
        val resultDialog = ValidationResultDialogFragment.newInstance(snapshot)
        resultDialog.show(supportFragmentManager, "ValidationResultDialog")
    }

    private fun showResultDialog(
        status: String, name: String, seminar: String, venue: String,
        seats: String, price: String, reason: String,
        bookingId: String = "—", date: String = "—", phone: String = ""
    ) {
        val resultDialog = ValidationResultDialogFragment.newInstance(
            GateTicketSnapshot(
                status = status, name = name, seminar = seminar, venue = venue,
                seats = seats, price = price, reason = reason,
                bookingId = bookingId, date = date, phone = phone, attendees = emptyList()
            )
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
