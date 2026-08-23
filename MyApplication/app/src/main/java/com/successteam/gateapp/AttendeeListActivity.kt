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
import android.widget.PopupMenu
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
 *  4. Provides Event + Time filters that work together with the tab state.
 */
class AttendeeListActivity : AppCompatActivity(), QRScannerDialogFragment.QRScannerListener {

    private lateinit var binding: ActivityAttendeeListBinding
    private val mainHandler = Handler(Looper.getMainLooper())
    private val CAMERA_PERMISSION_CODE = 201

    // All attendees loaded from Supabase (mutable, updated on scan)
    private val allAttendees = mutableListOf<GlobalAttendee>()
    private var showEntered = false   // current tab state

    // ── Filter state ──────────────────────────────────────────────────────────
    // null means "All Events"
    private var selectedEventFilter: String? = null
    // -1 means "All Time"; otherwise number of hours to look back
    private var selectedTimeFilterHours: Int = -1

    // Whether the filter panel is currently expanded
    private var filterPanelOpen = false

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

        // Filter panel toggle
        binding.btnFilterToggle.setOnClickListener { toggleFilterPanel() }

        // Event filter picker
        binding.tvFilterEventLabel.setOnClickListener { showEventFilterMenu(it) }

        // Time filter picker
        binding.tvFilterTimeLabel.setOnClickListener { showTimeFilterMenu(it) }

        // Reset filters
        binding.btnResetFilters.setOnClickListener { resetFilters() }

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
        // Step 1: filter by entry status (existing tab logic)
        var list = if (showEntered) {
            allAttendees.filter { it.checkedIn }
        } else {
            allAttendees.filter { !it.checkedIn }
        }

        // Step 2: apply event filter
        val eventFilter = selectedEventFilter
        if (!eventFilter.isNullOrBlank()) {
            list = list.filter { it.eventName.equals(eventFilter, ignoreCase = true) }
        }

        // Step 3: apply time filter
        if (selectedTimeFilterHours > 0) {
            val cutoffMs = System.currentTimeMillis() - selectedTimeFilterHours.toLong() * 60 * 60 * 1000
            list = list.filter { attendee ->
                // For entered attendees prefer checkedInAt timestamp; for unentered we have no
                // per-seat creation timestamp so we leave them unfiltered by time when not entered.
                val ts = attendee.checkedInAt
                if (!ts.isNullOrBlank()) {
                    parseTimestampMillis(ts) >= cutoffMs
                } else {
                    // No timestamp available — exclude from time-filtered results only if a
                    // time filter is active, to stay conservative (don't show unknowns)
                    false
                }
            }
        }

        updateTabCounts()
        renderAttendeeCards(list)
    }

    private fun updateCounts() {
        // Counts box is hidden (layoutCountChips is GONE)
    }

    /**
     * Computes how many attendees are entered / unentered after applying the
     * current event and time filters (same logic as renderCurrentTab), then
     * updates both tab button labels so the counts always match the list.
     * Called every time renderCurrentTab() runs.
     */
    private fun updateTabCounts() {
        // Apply event + time filters to the full list (no tab/entry-status filter)
        var filtered = allAttendees.toList()

        val eventFilter = selectedEventFilter
        if (!eventFilter.isNullOrBlank()) {
            filtered = filtered.filter { it.eventName.equals(eventFilter, ignoreCase = true) }
        }

        if (selectedTimeFilterHours > 0) {
            val cutoffMs = System.currentTimeMillis() - selectedTimeFilterHours.toLong() * 60 * 60 * 1000
            filtered = filtered.filter { attendee ->
                val ts = attendee.checkedInAt
                if (!ts.isNullOrBlank()) parseTimestampMillis(ts) >= cutoffMs else false
            }
        }

        val enteredCount   = filtered.count { it.checkedIn }
        val unenteredCount = filtered.count { !it.checkedIn }

        binding.btnTabUnentered.text = "Unentried ($unenteredCount)"
        binding.btnTabEntered.text   = "Entried ($enteredCount)"
    }

    // ── Filter panel ──────────────────────────────────────────────────────────

    private fun toggleFilterPanel() {
        filterPanelOpen = !filterPanelOpen
        binding.layoutFilterPanel.visibility = if (filterPanelOpen) View.VISIBLE else View.GONE
        binding.btnFilterToggle.text = if (filterPanelOpen) "✕ Close" else "⊞ Filter"
        updateFilterLabels()
    }

    /** Build event list dynamically from loaded attendee data, show popup. */
    private fun showEventFilterMenu(anchor: View) {
        val events = allAttendees
            .map { it.eventName.trim() }
            .filter { it.isNotBlank() }
            .distinct()
            .sorted()

        val popup = PopupMenu(this, anchor)
        popup.menu.add(0, 0, 0, "All Events")
        events.forEachIndexed { index, name ->
            popup.menu.add(0, index + 1, index + 1, name)
        }

        popup.setOnMenuItemClickListener { item ->
            selectedEventFilter = if (item.itemId == 0) null else item.title?.toString()
            updateFilterLabels()
            renderCurrentTab()
            true
        }
        popup.show()
    }

    private fun showTimeFilterMenu(anchor: View) {
        data class TimeOption(val label: String, val hours: Int)
        val options = listOf(
            TimeOption("All Time",      -1),
            TimeOption("Last 1 Hour",    1),
            TimeOption("Last 2 Hours",   2),
            TimeOption("Last 3 Hours",   3),
            TimeOption("Last 6 Hours",   6),
            TimeOption("Last 12 Hours", 12),
            TimeOption("Last 24 Hours", 24)
        )

        val popup = PopupMenu(this, anchor)
        options.forEachIndexed { index, opt ->
            popup.menu.add(0, index, index, opt.label)
        }

        popup.setOnMenuItemClickListener { item ->
            selectedTimeFilterHours = options[item.itemId].hours
            updateFilterLabels()
            renderCurrentTab()
            true
        }
        popup.show()
    }

    private fun resetFilters() {
        selectedEventFilter = null
        selectedTimeFilterHours = -1
        updateFilterLabels()
        renderCurrentTab()
    }

    private fun updateFilterLabels() {
        // Event label
        binding.tvFilterEventLabel.text = selectedEventFilter ?: "All Events"

        // Time label
        binding.tvFilterTimeLabel.text = when (selectedTimeFilterHours) {
            -1   -> "All Time"
            1    -> "Last 1 Hour"
            2    -> "Last 2 Hours"
            3    -> "Last 3 Hours"
            6    -> "Last 6 Hours"
            12   -> "Last 12 Hours"
            24   -> "Last 24 Hours"
            else -> "All Time"
        }

        // Show/hide the active filter indicator row
        val hasActiveFilter = selectedEventFilter != null || selectedTimeFilterHours > 0
        binding.layoutFilterActiveRow.visibility = if (hasActiveFilter) View.VISIBLE else View.GONE

        if (hasActiveFilter) {
            val parts = mutableListOf<String>()
            if (selectedEventFilter != null) parts.add(selectedEventFilter!!)
            if (selectedTimeFilterHours > 0) parts.add(binding.tvFilterTimeLabel.text.toString())
            binding.tvActiveFilterInfo.text = "Active: ${parts.joinToString(" · ")}"
        }

        // Update the header filter button to show a dot when filters are active
        if (!filterPanelOpen) {
            binding.btnFilterToggle.text = if (hasActiveFilter) "⊞ Filter ●" else "⊞ Filter"
        }
    }

    // ── Parse ISO-8601 timestamp to epoch millis ──────────────────────────────

    /**
     * Parses timestamps stored by Supabase/the gate app.
     * Handles formats like:
     *   2024-12-05T10:30:00Z
     *   2024-12-05T10:30:00+05:30
     * Returns 0 if parsing fails (which will exclude the attendee from
     * time-filtered results — safe conservative behaviour).
     */
    private fun parseTimestampMillis(ts: String): Long {
        return try {
            // Normalise to a format Java SimpleDateFormat can handle
            val normalised = ts.trim()
                .replace("Z", "+00:00")       // UTC marker → offset form

            // Try offset-aware parse first: yyyy-MM-dd'T'HH:mm:ssXXX
            val sdfOffset = java.text.SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ssXXX", java.util.Locale.US
            )
            sdfOffset.parse(normalised)?.time ?: 0L
        } catch (_: Exception) {
            try {
                // Fallback: strip offset and treat as UTC
                val plain = ts.trim()
                    .substringBefore("+")
                    .substringBefore("Z")
                    .substringBefore("z")
                val sdfUtc = java.text.SimpleDateFormat(
                    "yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US
                ).apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
                sdfUtc.parse(plain)?.time ?: 0L
            } catch (_: Exception) { 0L }
        }
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
