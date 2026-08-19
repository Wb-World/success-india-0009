package com.successteam.gateapp

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.DialogFragment
import com.successteam.gateapp.databinding.DialogValidationResultBinding
import com.google.android.material.card.MaterialCardView
import com.google.android.material.checkbox.MaterialCheckBox
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class ValidationResultDialogFragment : DialogFragment() {

    companion object {
        private const val ARG_TICKET_JSON = "ticketJson"

        fun newInstance(snapshot: GateTicketSnapshot): ValidationResultDialogFragment {
            val fragment = ValidationResultDialogFragment()
            val args = Bundle().apply {
                putString(ARG_TICKET_JSON, Gson().toJson(snapshot))
            }
            fragment.arguments = args
            return fragment
        }

        fun newInstance(
            status: String,
            name: String,
            seminar: String,
            venue: String,
            seats: String,
            price: String,
            reason: String,
            bookingId: String = "-",
            date: String = "-",
            phone: String = ""
        ): ValidationResultDialogFragment {
            return newInstance(
                GateTicketSnapshot(
                    status = status,
                    name = name,
                    seminar = seminar,
                    venue = venue,
                    seats = seats,
                    price = price,
                    reason = reason,
                    bookingId = bookingId,
                    date = date,
                    phone = phone,
                    attendees = emptyList()
                )
            )
        }
    }

    private var _binding: DialogValidationResultBinding? = null
    private val binding get() = _binding!!
    private val gson = Gson()
    private var approvalStore: GateApprovalStore? = null
    private val newlySelectedKeys = mutableSetOf<String>()
    var dismissCallback: (() -> Unit)? = null

    private var currentSnapshot: GateTicketSnapshot = GateTicketSnapshot(
        status = "error",
        name = "-",
        seminar = "-",
        venue = "-",
        seats = "-",
        price = "-",
        reason = "-",
        bookingId = "-",
        date = "-",
        phone = "",
        attendees = emptyList()
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setStyle(STYLE_NORMAL, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        dialog?.window?.apply {
            setBackgroundDrawable(ColorDrawable(android.graphics.Color.TRANSPARENT))
            requestFeature(Window.FEATURE_NO_TITLE)
        }
        _binding = DialogValidationResultBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        approvalStore = GateApprovalStore(requireContext().applicationContext)

        binding.viewDismissDimResult.setOnClickListener { dismiss() }
        binding.btnDismissResult.setOnClickListener {
            val bookingId = currentSnapshot.bookingId
            val context = context
            if (bookingId.isNotBlank() && newlySelectedKeys.isNotEmpty() && context != null) {
                // Resolve the attendee names
                val names = currentSnapshot.attendees
                    .filter { newlySelectedKeys.contains(it.key) }
                    .joinToString(", ") { it.name.ifBlank { "Guest" } }
                    .ifBlank { "Attendee" }

                // Save locally first
                val approvalStore = approvalStore
                if (approvalStore != null) {
                    for (key in newlySelectedKeys) {
                        approvalStore.approveAttendee(bookingId, key)
                    }
                }

                // If online, patch to Supabase in the background
                if (isNetworkAvailable(context)) {
                    val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
                    val keysToSave = newlySelectedKeys.toSet() // snapshot
                    Thread {
                        var allSucceeded = true
                        for (key in keysToSave) {
                            val ok = SupabaseAttendeeRepository.markCheckedIn(bookingId, key)
                            if (!ok) allSucceeded = false
                        }
                        mainHandler.post {
                            if (isAdded) {
                                if (allSucceeded) {
                                    android.widget.Toast.makeText(
                                        context,
                                        "✓ Entry granted: $names",
                                        android.widget.Toast.LENGTH_SHORT
                                    ).show()
                                } else {
                                    android.widget.Toast.makeText(
                                        context,
                                        "Saved $names locally. Failed to sync some check-ins to cloud.",
                                        android.widget.Toast.LENGTH_LONG
                                    ).show()
                                }
                            }
                        }
                    }.start()
                } else {
                    android.widget.Toast.makeText(
                        context,
                        "✓ Saved locally (Offline): $names. Will sync when online.",
                        android.widget.Toast.LENGTH_LONG
                    ).show()
                }
            }
            dismiss()
        }

        binding.cardResultContainer.alpha = 0f
        binding.cardResultContainer.scaleX = 0.8f
        binding.cardResultContainer.scaleY = 0.8f
        binding.cardResultContainer.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(400)
            .start()

        renderSnapshot(readSnapshotFromArgs())
    }

    private fun isNetworkAvailable(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
        val net = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(net) ?: return false
        return caps.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun updateStatus(status: String) {
        currentSnapshot = currentSnapshot.copy(status = status)
        arguments?.putString(ARG_TICKET_JSON, gson.toJson(currentSnapshot))
        refreshUi()
    }

    fun updateTicketData(snapshot: GateTicketSnapshot) {
        currentSnapshot = snapshot
        arguments?.putString(ARG_TICKET_JSON, gson.toJson(snapshot))
        refreshUi()
    }

    override fun onDismiss(dialog: android.content.DialogInterface) {
        super.onDismiss(dialog)
        dismissCallback?.invoke()
    }

    private fun readSnapshotFromArgs(): GateTicketSnapshot {
        val raw = arguments?.getString(ARG_TICKET_JSON).orEmpty().trim()
        if (raw.isBlank()) return currentSnapshot

        return try {
            gson.fromJson(raw, GateTicketSnapshot::class.java) ?: currentSnapshot
        } catch (_: Exception) {
            currentSnapshot
        }
    }

    private fun refreshUi() {
        if (_binding == null) return
        renderSnapshot(currentSnapshot)
    }

    private fun renderSnapshot(snapshot: GateTicketSnapshot) {
        currentSnapshot = snapshot

        binding.tvValBookingId.text = snapshot.bookingId
        binding.tvValAttendeeName.text = snapshot.name
        binding.tvValSeminar.text = snapshot.seminar
        binding.tvValVenue.text = snapshot.venue
        binding.tvValDate.text = snapshot.date
        binding.tvValSeats.text = snapshot.seats
        val cleanPrice = snapshot.price.replace("INR", "").replace("₹", "").trim()
        binding.tvValPrice.text = if (cleanPrice.isBlank()) "-" else "\u20B9$cleanPrice"

        if (snapshot.phone.isNotBlank()) {
            binding.tvValPhone.text = snapshot.phone
            binding.layoutPhoneRow.visibility = View.VISIBLE
        } else {
            binding.layoutPhoneRow.visibility = View.GONE
        }

        applyStatusStyle(snapshot.status, snapshot.reason, snapshot.name)
        renderAttendeeSection(snapshot)

        binding.layoutStatusIconContainer.alpha = 0f
        binding.layoutStatusIconContainer.scaleX = 0f
        binding.layoutStatusIconContainer.scaleY = 0f
        binding.layoutStatusIconContainer.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(500)
            .setStartDelay(200)
            .start()
    }

    private fun formatTime(timestamp: String?): String {
        if (timestamp.isNullOrBlank()) return ""
        return try {
            if (timestamp.contains("T")) {
                val timePart = timestamp.substringAfter("T")
                val cleanTime = when {
                    timePart.contains("+") -> timePart.substringBefore("+")
                    timePart.contains("Z") -> timePart.substringBefore("Z")
                    else -> timePart
                }
                if (cleanTime.length >= 5) cleanTime.substring(0, 5) else cleanTime
            } else {
                timestamp
            }
        } catch (e: Exception) {
            timestamp
        }
    }

    private fun renderAttendeeSection(snapshot: GateTicketSnapshot) {
        val attendees = snapshot.attendees
        if (attendees.isEmpty()) {
            binding.layoutAttendeeSection.visibility = View.GONE
            return
        }

        val bookingId = snapshot.bookingId.ifBlank { "-" }
        val canApprove = snapshot.approvalsEnabled && canApproveAttendees(snapshot.status)
        val serverApprovedCount = attendees.count { it.checkedIn }
        val totalApprovedCount = serverApprovedCount + newlySelectedKeys.size
        val remainingCount = attendees.size - totalApprovedCount

        binding.layoutAttendeeSection.visibility = View.VISIBLE
        binding.tvAttendeeSectionTitle.text = if (canApprove) "ATTENDEE APPROVALS" else "ATTENDEE LIST"
        binding.tvAttendeeSectionSummary.text = when {
            totalApprovedCount == attendees.size -> "All approved"
            totalApprovedCount == 0 -> "${attendees.size} total"
            else -> "$totalApprovedCount approved / ${attendees.size} total"
        }
        binding.tvAttendeeSectionHint.text = when {
            !snapshot.approvalsEnabled -> "Attendee details are still loading from the booking record. This list is read only for the moment."
            canApprove && remainingCount == 0 -> "All attendees have already been approved."
            canApprove -> "Tick the checkbox on the right for each attendee who has arrived."
            else -> "This ticket is not in an approvable state, so the attendee list is read only."
        }

        // Build separate entered and unentered lists
        val enteredAttendees = attendees.filter { it.checkedIn || newlySelectedKeys.contains(it.key) }
        val unenteredAttendees = attendees.filterNot { it.checkedIn || newlySelectedKeys.contains(it.key) }

        binding.layoutEnteredList.removeAllViews()
        enteredAttendees.forEachIndexed { index, attendee ->
            binding.layoutEnteredList.addView(
                createAttendeeRow(
                    attendee = attendee,
                    bookingId = bookingId,
                    canApprove = canApprove,
                    position = index + 1,
                    attendees = attendees
                )
            )
        }

        binding.layoutUnenteredList.removeAllViews()
        unenteredAttendees.forEachIndexed { index, attendee ->
            binding.layoutUnenteredList.addView(
                createAttendeeRow(
                    attendee = attendee,
                    bookingId = bookingId,
                    canApprove = canApprove,
                    position = index + 1,
                    attendees = attendees
                )
            )
        }

        // Keep legacy list hidden
        binding.layoutAttendeeList.removeAllViews()
        binding.layoutAttendeeList.visibility = View.GONE

        // Default: show Unentered panel
        showEnteredPanel(showEntered = false)

        // Wire toggle buttons
        binding.btnEnteredFilter.setOnClickListener {
            showEnteredPanel(showEntered = true)
        }
        binding.btnUnenteredFilter.setOnClickListener {
            showEnteredPanel(showEntered = false)
        }
    }

    /**
     * Switches the visible attendee list between Entered and Unentered,
     * and updates button visual state accordingly.
     */
    private fun showEnteredPanel(showEntered: Boolean) {
        val context = requireContext()
        if (showEntered) {
            binding.layoutEnteredList.visibility = View.VISIBLE
            binding.layoutUnenteredList.visibility = View.GONE
            // Active: Entered button
            binding.btnEnteredFilter.setBackgroundResource(R.drawable.btn_gradient_bg)
            binding.btnEnteredFilter.setTextColor(ContextCompat.getColor(context, R.color.white))
            // Inactive: Unentered button
            binding.btnUnenteredFilter.setBackgroundColor(ContextCompat.getColor(context, R.color.white))
            binding.btnUnenteredFilter.setTextColor(ContextCompat.getColor(context, R.color.primary))
        } else {
            binding.layoutEnteredList.visibility = View.GONE
            binding.layoutUnenteredList.visibility = View.VISIBLE
            // Inactive: Entered button
            binding.btnEnteredFilter.setBackgroundColor(ContextCompat.getColor(context, R.color.white))
            binding.btnEnteredFilter.setTextColor(ContextCompat.getColor(context, R.color.primary))
            // Active: Unentered button
            binding.btnUnenteredFilter.setBackgroundResource(R.drawable.btn_gradient_bg)
            binding.btnUnenteredFilter.setTextColor(ContextCompat.getColor(context, R.color.white))
        }
    }

    private fun createAttendeeRow(
        attendee: GateAttendee,
        bookingId: String,
        canApprove: Boolean,
        position: Int,
        attendees: List<GateAttendee>
    ): View {
        val context = requireContext()
        val approved = attendee.checkedIn
        val newlyChecked = newlySelectedKeys.contains(attendee.key)
        val initiallyChecked = approved || newlyChecked

        val card = MaterialCardView(context).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dp(10)
            }
            radius = dp(16).toFloat()
            cardElevation = dp(0).toFloat()
            strokeWidth = dp(1)
            strokeColor = ContextCompat.getColor(
                context,
                when {
                    approved -> R.color.primary
                    newlyChecked -> R.color.primary
                    else -> R.color.gray_divider
                }
            )
            setCardBackgroundColor(
                ContextCompat.getColor(
                    context,
                    when {
                        approved -> R.color.primary_light
                        newlyChecked -> R.color.card_bg
                        canApprove -> R.color.white
                        else -> R.color.gray_light
                    }
                )
            )
        }

        val row = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(14), dp(12), dp(12), dp(12))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        val textColumn = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }

        val seatText = TextView(context).apply {
            text = attendee.seatLabel.ifBlank { "Attendee $position" }
            setTextColor(ContextCompat.getColor(context, R.color.primary_dark))
            setTypeface(null, Typeface.BOLD)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        }

        val nameText = TextView(context).apply {
            text = attendee.name.ifBlank { "Guest" }
            setTextColor(ContextCompat.getColor(context, if (approved) R.color.primary_dark else R.color.foreground))
            setTypeface(null, Typeface.BOLD)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            setPadding(0, dp(2), 0, 0)
        }

        // Business Center — per-attendee, falls back to "Not specified" for legacy records
        val bizCenterLabel = attendee.businessCenter.trim().ifBlank { "Not specified" }
        val bizCenterText = TextView(context).apply {
            text = "Business Center: $bizCenterLabel"
            setTextColor(ContextCompat.getColor(context,
                if (approved) R.color.primary_dark else R.color.muted))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            setPadding(0, dp(3), 0, 0)
        }

        val metaParts = mutableListOf<String>()
        if (approved) {
            val formattedTime = formatTime(attendee.checkedInAt)
            metaParts.add("Already Checked In" + (if (formattedTime.isNotBlank()) " ($formattedTime)" else ""))
        } else {
            if (attendee.whatsapp.isNotBlank()) metaParts.add(attendee.whatsapp)
            if (attendee.lunch.isNotBlank()) metaParts.add(attendee.lunch)
        }

        val metaText = TextView(context).apply {
            text = metaParts.joinToString("  •  ")
            visibility = if (metaParts.isEmpty()) View.GONE else View.VISIBLE
            setTextColor(ContextCompat.getColor(context, R.color.muted))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            setPadding(0, dp(3), 0, 0)
        }

        val checkbox = MaterialCheckBox(context).apply {
            isChecked = initiallyChecked
            isEnabled = canApprove && !approved
            contentDescription = if (approved) {
                "Approved ${attendee.name}"
            } else {
                "Approve ${attendee.name}"
            }
            buttonTintList = ColorStateList.valueOf(
                ContextCompat.getColor(
                    context,
                    if (initiallyChecked) R.color.primary else R.color.primary_dark
                )
            )
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                marginStart = dp(8)
            }
        }

        checkbox.setOnCheckedChangeListener(null)
        checkbox.setOnCheckedChangeListener { _, checked ->
            if (checked) {
                newlySelectedKeys.add(attendee.key)
            } else {
                newlySelectedKeys.remove(attendee.key)
            }

            val newTotalApprovedCount = attendees.count { it.checkedIn } + newlySelectedKeys.size
            binding.tvAttendeeSectionSummary.text = when {
                newTotalApprovedCount == attendees.size -> "All approved"
                newTotalApprovedCount == 0 -> "${attendees.size} total"
                else -> "$newTotalApprovedCount approved / ${attendees.size} total"
            }

            binding.tvAttendeeSectionHint.text = when {
                newTotalApprovedCount == attendees.size -> "All attendees have already been approved."
                else -> "Tick the checkbox on the right for each attendee who has arrived."
            }

            // Re-render split lists so the attendee moves between Entered / Unentered
            renderAttendeeSection(currentSnapshot)
        }

        textColumn.addView(seatText)
        textColumn.addView(nameText)
        textColumn.addView(bizCenterText)
        if (metaParts.isNotEmpty()) {
            textColumn.addView(metaText)
        }

        row.addView(textColumn)
        row.addView(checkbox)
        card.addView(row)
        return card
    }

    private fun canApproveAttendees(status: String): Boolean {
        return when (status.lowercase()) {
            "approved", "confirmed", "valid", "success", "partial", "partially_checked_in" -> true
            else -> false
        }
    }

    private fun applyStatusStyle(status: String, reason: String, name: String) {
        val context = requireContext()
        binding.ivStatusLogo.visibility = View.GONE
        binding.tvStatusIndicatorEmoji.visibility = View.VISIBLE

        when (status.lowercase()) {
            "approved", "confirmed", "valid", "success", "partial", "partially_checked_in" -> {
                binding.tvStatusIndicatorEmoji.text = "✓"
                binding.tvStatusIndicatorEmoji.setTextColor(ContextCompat.getColor(context, R.color.primary))

                binding.tvValidationTitle.text = "VALID TICKET"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.primary))
                binding.tvValidationSubtitle.text = "Entry Authorized"

                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.GONE
            }
            "already_entered" -> {
                binding.tvStatusIndicatorEmoji.text = "⛔"
                binding.tvStatusIndicatorEmoji.setTextColor(ContextCompat.getColor(context, R.color.danger))

                binding.tvValidationTitle.text = "ALREADY ENTERED"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvValidationSubtitle.text = "Duplicate Scan — Re-entry Not Permitted"

                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(ContextCompat.getColor(context, R.color.danger_bg))
                binding.tvErrorReasonHeader.text = "ENTRY ALREADY RECORDED"
                binding.tvErrorReasonHeader.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvErrorReasonText.text = reason.ifBlank {
                    "This ticket has already been scanned and entry was granted. Re-entry is not permitted."
                }
            }
            "completed" -> {
                binding.tvStatusIndicatorEmoji.text = "⛔"
                binding.tvStatusIndicatorEmoji.setTextColor(ContextCompat.getColor(context, R.color.danger))

                binding.tvValidationTitle.text = "FULLY CHECKED IN"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvValidationSubtitle.text = "All Attendees Verified"

                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(ContextCompat.getColor(context, R.color.danger_bg))
                binding.tvErrorReasonHeader.text = "ALL ATTENDEES CHECKED IN"
                binding.tvErrorReasonHeader.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvErrorReasonText.text = reason.ifBlank {
                    "All attendees for this booking have already been checked in. No pending attendees remain."
                }
            }
            "pending" -> {
                binding.tvStatusIndicatorEmoji.text = "⏳"
                binding.tvStatusIndicatorEmoji.setTextColor(ContextCompat.getColor(context, R.color.warning))

                binding.tvValidationTitle.text = "INVALID TICKET"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvValidationSubtitle.text = "Payment Pending - Entry Denied"

                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(ContextCompat.getColor(context, R.color.warning_bg))
                binding.tvErrorReasonHeader.text = "PENDING APPROVAL"
                binding.tvErrorReasonHeader.setTextColor(ContextCompat.getColor(context, R.color.warning))
                binding.tvErrorReasonText.text = reason.ifBlank {
                    "This booking is awaiting admin confirmation. Entry is not permitted until approved."
                }
            }
            "denied" -> {
                binding.tvStatusIndicatorEmoji.text = "✕"
                binding.tvStatusIndicatorEmoji.setTextColor(ContextCompat.getColor(context, R.color.danger))

                binding.tvValidationTitle.text = "INVALID TICKET"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvValidationSubtitle.text = "Entry Denied"

                if (name != "-" && name.isNotBlank() && name != "Unknown") {
                    binding.layoutAttendeeDetails.visibility = View.VISIBLE
                } else {
                    binding.layoutAttendeeDetails.visibility = View.GONE
                }

                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(ContextCompat.getColor(context, R.color.danger_bg))
                binding.tvErrorReasonHeader.text = "REJECTION DETAILS"
                binding.tvErrorReasonHeader.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvErrorReasonText.text = reason.ifBlank {
                    "This booking was rejected or does not exist."
                }
            }
            "error" -> {
                binding.tvStatusIndicatorEmoji.text = "⚠"
                binding.tvStatusIndicatorEmoji.setTextColor(ContextCompat.getColor(context, R.color.warning))

                binding.tvValidationTitle.text = "VERIFICATION ERROR"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.warning))
                binding.tvValidationSubtitle.text = "Could not verify ticket status"

                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(ContextCompat.getColor(context, R.color.warning_bg))
                binding.tvErrorReasonHeader.text = "SERVICE UNAVAILABLE"
                binding.tvErrorReasonHeader.setTextColor(ContextCompat.getColor(context, R.color.warning))
                binding.tvErrorReasonText.text = reason.ifBlank {
                    "Verification Service Unavailable. Please try again or check your connection."
                }
            }
            else -> {
                binding.tvStatusIndicatorEmoji.text = "?"
                binding.tvStatusIndicatorEmoji.setTextColor(ContextCompat.getColor(context, R.color.danger))

                binding.tvValidationTitle.text = "UNKNOWN STATUS"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvValidationSubtitle.text = "Entry Denied - Status Unrecognized"

                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(ContextCompat.getColor(context, R.color.danger_bg))
                binding.tvErrorReasonHeader.text = "REASON"
                binding.tvErrorReasonHeader.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvErrorReasonText.text = reason.ifBlank {
                    "The booking status \"$status\" is not recognized."
                }
            }
        }
    }

    private fun dp(value: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value.toFloat(),
            resources.displayMetrics
        ).toInt()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        approvalStore = null
        _binding = null
    }
}

private class GateApprovalStore(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
    private val gson = Gson()
    private val typeToken = object : TypeToken<Map<String, List<String>>>() {}.type
    private var cache: MutableMap<String, MutableSet<String>>? = null

    fun getApprovedAttendeeKeys(bookingId: String): Set<String> {
        return load()[bookingId].orEmpty().toSet()
    }

    fun isApproved(bookingId: String, attendeeKey: String): Boolean {
        if (bookingId.isBlank() || attendeeKey.isBlank()) return false
        return getApprovedAttendeeKeys(bookingId).contains(attendeeKey)
    }

    fun approveAttendee(bookingId: String, attendeeKey: String) {
        if (bookingId.isBlank() || attendeeKey.isBlank()) return
        val map = load()
        val set = map.getOrPut(bookingId) { mutableSetOf() }
        if (set.add(attendeeKey)) {
            save(map)
        }
    }

    private fun load(): MutableMap<String, MutableSet<String>> {
        cache?.let { return it }

        val raw = prefs.getString(KEY_APPROVALS_JSON, "").orEmpty().trim()
        if (raw.isBlank()) {
            val empty = mutableMapOf<String, MutableSet<String>>()
            cache = empty
            return empty
        }

        val parsed = try {
            val loaded: Map<String, List<String>>? = gson.fromJson(raw, typeToken)
            loaded.orEmpty().mapValues { it.value.toMutableSet() }.toMutableMap()
        } catch (_: Exception) {
            mutableMapOf()
        }

        cache = parsed
        return parsed
    }

    private fun save(map: MutableMap<String, MutableSet<String>>) {
        val serializable = map.mapValues { it.value.toList() }
        prefs.edit().putString(KEY_APPROVALS_JSON, gson.toJson(serializable)).apply()
        cache = map
    }

    private companion object {
        const val PREFS_FILE = "gate_attendee_approvals"
        const val KEY_APPROVALS_JSON = "approved_attendee_keys"
    }
}
