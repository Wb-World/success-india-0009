package com.example.myapplication

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
import com.example.myapplication.databinding.DialogValidationResultBinding
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
        binding.btnDismissResult.setOnClickListener { dismiss() }

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

    private fun renderAttendeeSection(snapshot: GateTicketSnapshot) {
        val attendees = snapshot.attendees
        if (attendees.isEmpty()) {
            binding.layoutAttendeeSection.visibility = View.GONE
            return
        }

        val bookingId = snapshot.bookingId.ifBlank { "-" }
        val canApprove = snapshot.approvalsEnabled && canApproveAttendees(snapshot.status)
        val approvedKeys = approvalStore?.getApprovedAttendeeKeys(bookingId).orEmpty()
        val approvedCount = attendees.count { approvedKeys.contains(it.key) }
        val remainingCount = attendees.size - approvedCount

        binding.layoutAttendeeSection.visibility = View.VISIBLE
        binding.tvAttendeeSectionTitle.text = if (canApprove) "ATTENDEE APPROVALS" else "ATTENDEE LIST"
        binding.tvAttendeeSectionSummary.text = when {
            approvedCount == attendees.size -> "All approved"
            approvedCount == 0 -> "${attendees.size} total"
            else -> "$approvedCount approved / ${attendees.size} total"
        }
        binding.tvAttendeeSectionHint.text = when {
            !snapshot.approvalsEnabled -> "Attendee details are still loading from the booking record. This list is read only for the moment."
            canApprove && remainingCount == 0 -> "All attendees have already been approved."
            canApprove -> "Tick the checkbox on the right for each attendee who has arrived."
            else -> "This ticket is not in an approvable state, so the attendee list is read only."
        }

        binding.layoutAttendeeList.removeAllViews()
        attendees.forEachIndexed { index, attendee ->
            binding.layoutAttendeeList.addView(
                createAttendeeRow(
                    attendee = attendee,
                    bookingId = bookingId,
                    canApprove = canApprove,
                    position = index + 1
                )
            )
        }
    }

    private fun createAttendeeRow(
        attendee: GateAttendee,
        bookingId: String,
        canApprove: Boolean,
        position: Int
    ): View {
        val context = requireContext()
        val approved = approvalStore?.isApproved(bookingId, attendee.key) == true
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
                if (approved) R.color.primary_light else R.color.gray_divider
            )
            setCardBackgroundColor(
                ContextCompat.getColor(
                    context,
                    when {
                        approved -> R.color.primary_light
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

        val metaParts = mutableListOf<String>()
        if (attendee.whatsapp.isNotBlank()) metaParts.add(attendee.whatsapp)
        if (attendee.lunch.isNotBlank()) metaParts.add(attendee.lunch)

        val metaText = TextView(context).apply {
            text = metaParts.joinToString("  •  ")
            visibility = if (metaParts.isEmpty()) View.GONE else View.VISIBLE
            setTextColor(ContextCompat.getColor(context, R.color.muted))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            setPadding(0, dp(3), 0, 0)
        }

        val checkbox = MaterialCheckBox(context).apply {
            isChecked = approved
            isEnabled = canApprove && !approved
            contentDescription = if (approved) {
                "Approved ${attendee.name}"
            } else {
                "Approve ${attendee.name}"
            }
            buttonTintList = ColorStateList.valueOf(
                ContextCompat.getColor(
                    context,
                    if (approved) R.color.primary else R.color.primary_dark
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
        checkbox.isChecked = approved
        checkbox.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked && !approved) {
                approvalStore?.approveAttendee(bookingId, attendee.key)
                refreshUi()
            }
        }

        textColumn.addView(seatText)
        textColumn.addView(nameText)
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
            "approved", "confirmed", "valid", "success" -> true
            else -> false
        }
    }

    private fun applyStatusStyle(status: String, reason: String, name: String) {
        val context = requireContext()
        when (status.lowercase()) {
            "approved", "confirmed", "valid", "success" -> {
                binding.ivStatusLogo.visibility = View.VISIBLE
                binding.tvStatusIndicatorEmoji.visibility = View.GONE

                binding.tvValidationTitle.text = "VALID TICKET"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.primary))
                binding.tvValidationSubtitle.text = "Entry Authorized"

                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.GONE
            }
            "pending" -> {
                binding.ivStatusLogo.visibility = View.GONE
                binding.tvStatusIndicatorEmoji.visibility = View.VISIBLE
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
                binding.ivStatusLogo.visibility = View.GONE
                binding.tvStatusIndicatorEmoji.visibility = View.VISIBLE
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
                binding.ivStatusLogo.visibility = View.GONE
                binding.tvStatusIndicatorEmoji.visibility = View.VISIBLE
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
                binding.ivStatusLogo.visibility = View.GONE
                binding.tvStatusIndicatorEmoji.visibility = View.VISIBLE
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
