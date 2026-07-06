package com.successteam.gateapp

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.successteam.gateapp.databinding.ActivityAttendeeListBinding
import com.google.android.material.card.MaterialCardView

/**
 * Full-screen activity that:
 *  1. Checks internet on launch — shows error banner if offline.
 *  2. Fetches ALL approved attendees from Supabase and displays them
 *     in Entered / Unentered panels.
 *  3. Hosts the QR scanner; on a successful scan, finds the matching
 *     attendee, marks them as entered in Supabase, moves them to the
 *     Entered list, and shows the standard result dialog.
 */
class AttendeeListActivity : AppCompatActivity(), QRScannerDialogFragment.QRScannerListener {

    private lateinit var binding: ActivityAttendeeListBinding
    private val mainHandler = Handler(Looper.getMainLooper())
    private val CAMERA_PERMISSION_CODE = 201

    // All attendees loaded from Supabase (mutable, updated on scan)
    private val allAttendees = mutableListOf<GlobalAttendee>()
    private var showEntered = false   // current tab state

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAttendeeListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener { finish() }

        binding.btnTabUnentered.setOnClickListener { activateTab(false) }
        binding.btnTabEntered.setOnClickListener   { activateTab(true)  }

        binding.btnScanFab.setOnClickListener { checkCameraAndScan() }
        binding.btnRetryInternet.setOnClickListener { checkInternetAndLoad() }

        checkInternetAndLoad()
    }

    // ── Internet check ────────────────────────────────────────────────────────

    private fun isOnline(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun checkInternetAndLoad() {
        if (!isOnline()) {
            binding.layoutNoInternet.visibility = View.VISIBLE
            binding.pbLoading.visibility = View.GONE
            binding.scrollAttendees.visibility = View.GONE
            return
        }
        binding.layoutNoInternet.visibility = View.GONE
        loadAttendeesFromSupabase()
    }

    // ── Load attendees ────────────────────────────────────────────────────────

    private fun loadAttendeesFromSupabase() {
        binding.pbLoading.visibility = View.VISIBLE
        binding.scrollAttendees.visibility = View.GONE

        Thread {
            try {
                val fetched = SupabaseAttendeeRepository.fetchAllAttendees()
                mainHandler.post {
                    allAttendees.clear()
                    allAttendees.addAll(fetched)
                    binding.pbLoading.visibility = View.GONE
                    binding.scrollAttendees.visibility = View.VISIBLE
                    updateCounts()
                    renderCurrentTab()
                }
            } catch (e: Exception) {
                mainHandler.post {
                    binding.pbLoading.visibility = View.GONE
                    binding.scrollAttendees.visibility = View.GONE
                    binding.layoutNoInternet.visibility = View.VISIBLE
                    Toast.makeText(
                        this,
                        "Failed to load attendees: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }.start()
    }

    // ── Tab switching ─────────────────────────────────────────────────────────

    private fun activateTab(entered: Boolean) {
        showEntered = entered
        if (entered) {
            // Entered tab active
            binding.btnTabEntered.setBackgroundResource(R.drawable.btn_gradient_bg)
            binding.btnTabEntered.setTextColor(ContextCompat.getColor(this, R.color.white))
            binding.btnTabUnentered.setBackgroundColor(ContextCompat.getColor(this, R.color.white))
            binding.btnTabUnentered.setTextColor(ContextCompat.getColor(this, R.color.primary))
        } else {
            // Unentered tab active
            binding.btnTabUnentered.setBackgroundResource(R.drawable.btn_gradient_bg)
            binding.btnTabUnentered.setTextColor(ContextCompat.getColor(this, R.color.white))
            binding.btnTabEntered.setBackgroundColor(ContextCompat.getColor(this, R.color.white))
            binding.btnTabEntered.setTextColor(ContextCompat.getColor(this, R.color.primary))
        }
        renderCurrentTab()
    }

    private fun renderCurrentTab() {
        val list = if (showEntered) {
            allAttendees.filter { it.checkedIn }
        } else {
            allAttendees.filter { !it.checkedIn }
        }
        renderAttendeeCards(list)
    }

    private fun updateCounts() {
        // Counts box is hidden (layoutCountChips is GONE)
    }

    // ── Render attendee cards ─────────────────────────────────────────────────

    private fun renderAttendeeCards(list: List<GlobalAttendee>) {
        binding.layoutAttendeeCards.removeAllViews()

        if (list.isEmpty()) {
            val emptyTv = TextView(this).apply {
                text = if (showEntered) "No entered attendees found." else "No unentered attendees found."
                setTextColor(ContextCompat.getColor(this@AttendeeListActivity, R.color.muted))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
                gravity = Gravity.CENTER
                setPadding(0, dp(32), 0, dp(8))
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
            }
            binding.layoutAttendeeCards.addView(emptyTv)
            return
        }

        for (attendee in list) {
            binding.layoutAttendeeCards.addView(createAttendeeCard(attendee))
        }
    }

    private fun createAttendeeCard(attendee: GlobalAttendee): View {
        val card = MaterialCardView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(10) }
            radius = dp(14).toFloat()
            cardElevation = dp(2).toFloat()
            strokeWidth = dp(1)
            strokeColor = ContextCompat.getColor(
                this@AttendeeListActivity,
                if (attendee.checkedIn) R.color.primary else R.color.gray_divider
            )
            setCardBackgroundColor(
                ContextCompat.getColor(
                    this@AttendeeListActivity,
                    if (attendee.checkedIn) R.color.primary_light else R.color.white
                )
            )
        }

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(14), dp(12), dp(12), dp(12))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        // Status circle
        val statusCircle = TextView(this).apply {
            text = if (attendee.checkedIn) "✓" else "○"
            setTextColor(ContextCompat.getColor(this@AttendeeListActivity,
                if (attendee.checkedIn) R.color.white else R.color.muted))
            background = ContextCompat.getDrawable(this@AttendeeListActivity, R.drawable.circle_primary_bg)
            backgroundTintList = ColorStateList.valueOf(
                ContextCompat.getColor(
                    this@AttendeeListActivity,
                    if (attendee.checkedIn) R.color.primary else R.color.gray_divider
                )
            )
            gravity = Gravity.CENTER
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            setTypeface(null, Typeface.BOLD)
            val size = dp(32)
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                marginEnd = dp(12)
            }
        }

        val textCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }

        val nameView = TextView(this).apply {
            text = attendee.name
            setTextColor(ContextCompat.getColor(this@AttendeeListActivity, R.color.foreground))
            setTypeface(null, Typeface.BOLD)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
        }

        val seatView = TextView(this).apply {
            text = buildString {
                if (attendee.seatLabel.isNotBlank()) append(attendee.seatLabel)
                if (attendee.eventName.isNotBlank()) {
                    if (isNotEmpty()) append("  •  ")
                    append(attendee.eventName)
                }
            }.ifBlank { attendee.bookingId }
            setTextColor(ContextCompat.getColor(this@AttendeeListActivity, R.color.muted))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            setPadding(0, dp(2), 0, 0)
        }

        if (attendee.checkedIn && !attendee.checkedInAt.isNullOrBlank()) {
            val timeView = TextView(this).apply {
                text = "Entered at ${formatShortTime(attendee.checkedInAt)}"
                setTextColor(ContextCompat.getColor(this@AttendeeListActivity, R.color.primary))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
                setPadding(0, dp(2), 0, 0)
            }
            textCol.addView(nameView)
            textCol.addView(seatView)
            textCol.addView(timeView)
        } else {
            textCol.addView(nameView)
            textCol.addView(seatView)
        }

        row.addView(statusCircle)
        row.addView(textCol)
        card.addView(row)
        return card
    }

    private fun formatShortTime(ts: String?): String {
        if (ts.isNullOrBlank()) return ""
        return try {
            val timePart = if (ts.contains("T")) ts.substringAfter("T") else ts
            val clean = when {
                timePart.contains("+") -> timePart.substringBefore("+")
                timePart.contains("Z") -> timePart.substringBefore("Z")
                else -> timePart
            }
            if (clean.length >= 5) clean.substring(0, 5) else clean
        } catch (_: Exception) { "" }
    }

    // ── QR scan → mark entered ────────────────────────────────────────────────

    private fun checkCameraAndScan() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED) {
            launchScanner()
        } else {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.CAMERA),
                CAMERA_PERMISSION_CODE
            )
        }
    }

    override fun onRequestPermissionsResult(
        code: Int, permissions: Array<out String>, results: IntArray
    ) {
        super.onRequestPermissionsResult(code, permissions, results)
        if (code == CAMERA_PERMISSION_CODE && results.isNotEmpty()
            && results[0] == PackageManager.PERMISSION_GRANTED) {
            launchScanner()
        } else {
            Toast.makeText(this, "Camera permission required to scan", Toast.LENGTH_SHORT).show()
        }
    }

    private fun launchScanner() {
        val dialog = QRScannerDialogFragment()
        dialog.setScannerListener(this)
        dialog.show(supportFragmentManager, "AttendeeScanner")
    }

    /**
     * Called when the QR scanner detects a code.
     * Resolves the booking ID, finds the matching attendees, marks the first
     * unentered one as checked-in, and refreshes the list.
     */
    override fun onQRScanned(data: String) {
        if (!isOnline()) {
            Toast.makeText(this, "No internet — cannot verify ticket.", Toast.LENGTH_LONG).show()
            return
        }

        val bookingId = resolveBookingId(data)
        if (bookingId.isBlank()) {
            showScanResultDialog(null, "Invalid QR code — no booking ID found.")
            return
        }

        // Fetch booking from Supabase and show the validation dialog.
        // The user will manually tick attendees in the dialog to mark check-in.
        binding.pbLoading.visibility = View.VISIBLE
        Thread {
            val snapshot = SupabaseAttendeeRepository.fetchBooking(bookingId)
            mainHandler.post {
                binding.pbLoading.visibility = View.GONE
                if (snapshot != null) {
                    showValidationDialog(snapshot)
                } else {
                    showScanResultDialog(null, "Booking $bookingId not found in approved attendee list.")
                }
            }
        }.start()
    }

    private fun showValidationDialog(snapshot: GateTicketSnapshot) {
        val dialog = ValidationResultDialogFragment.newInstance(snapshot)
        dialog.dismissCallback = { loadAttendeesFromSupabase() }
        dialog.show(supportFragmentManager, "ScanResult")
    }

    private fun showScanResultDialog(bookingId: String?, message: String) {
        val entered = bookingId?.let { id ->
            allAttendees.filter { it.bookingId.equals(id, ignoreCase = true) }
                .firstOrNull { it.checkedIn }
        }

        val snapshot = GateTicketSnapshot(
            status = if (bookingId != null && entered != null) "approved" else "error",
            name = entered?.name ?: "—",
            seminar = entered?.eventName ?: "—",
            venue = "—",
            seats = entered?.seatLabel ?: "—",
            price = "—",
            reason = message,
            bookingId = bookingId ?: "—",
            date = "—"
        )

        val dialog = ValidationResultDialogFragment.newInstance(snapshot)
        dialog.show(supportFragmentManager, "ScanResult")
    }

    // ── Booking ID extraction ─────────────────────────────────────────────────

    private fun resolveBookingId(data: String): String {
        val trimmed = data.trim()

        // URL format: ?id=...
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            try {
                val uri = android.net.Uri.parse(trimmed)
                val id = uri.getQueryParameter("id")
                if (!id.isNullOrBlank()) return id.trim().uppercase()
            } catch (_: Exception) {}
        }

        // Pipe format: BOOKING_ID:... | ... or BOOKING:...
        if (trimmed.contains("|")) {
            val parts = trimmed.split("|")
            for (part in parts) {
                val colonIdx = part.indexOf(":")
                if (colonIdx > 0) {
                    val key = part.substring(0, colonIdx).trim().uppercase()
                    if (key == "BOOKING_ID" || key == "BOOKING") {
                        return part.substring(colonIdx + 1).trim().uppercase()
                    }
                }
            }
        }

        // JSON format
        if (trimmed.startsWith("{")) {
            return try {
                val json = com.google.gson.JsonParser.parseString(trimmed).asJsonObject
                (json.get("bookingId")?.asString
                    ?: json.get("id")?.asString
                    ?: json.get("booking_id")?.asString
                    ?: "").trim().uppercase()
            } catch (_: Exception) { "" }
        }

        // EVT-XXXX-XXXXXX pattern
        if (trimmed.matches(Regex("EVT-\\d{4}-[A-Z0-9]{6,12}"))) return trimmed

        // Plain ID
        if (trimmed.isNotBlank() && !trimmed.contains(" ")) return trimmed.uppercase()

        return ""
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun dp(v: Int): Int = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics
    ).toInt()
}
