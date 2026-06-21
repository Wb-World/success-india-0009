package com.example.myapplication

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.Window
import androidx.core.content.ContextCompat
import androidx.fragment.app.DialogFragment
import com.example.myapplication.databinding.DialogValidationResultBinding

class ValidationResultDialogFragment : DialogFragment() {

    companion object {
        fun newInstance(
            status: String,
            name: String,
            seminar: String,
            venue: String,
            seats: String,
            price: String,
            reason: String,
            bookingId: String = "—",
            date: String = "—"
        ): ValidationResultDialogFragment {
            val fragment = ValidationResultDialogFragment()
            val args = Bundle().apply {
                putString("status", status)
                putString("name", name)
                putString("seminar", seminar)
                putString("venue", venue)
                putString("seats", seats)
                putString("price", price)
                putString("reason", reason)
                putString("bookingId", bookingId)
                putString("date", date)
            }
            fragment.arguments = args
            return fragment
        }
    }

    private var _binding: DialogValidationResultBinding? = null
    private val binding get() = _binding!!

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
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            requestFeature(Window.FEATURE_NO_TITLE)
        }
        _binding = DialogValidationResultBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

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

        val status = arguments?.getString("status") ?: "error"
        val name = arguments?.getString("name") ?: "—"
        val seminar = arguments?.getString("seminar") ?: "—"
        val venue = arguments?.getString("venue") ?: "—"
        val seats = arguments?.getString("seats") ?: "—"
        val price = arguments?.getString("price") ?: "—"
        val reason = arguments?.getString("reason") ?: "—"
        val bookingId = arguments?.getString("bookingId") ?: "—"
        val date = arguments?.getString("date") ?: "—"

        binding.tvValBookingId.text = bookingId
        binding.tvValAttendeeName.text = name
        binding.tvValSeminar.text = seminar
        binding.tvValVenue.text = venue
        binding.tvValDate.text = date
        binding.tvValSeats.text = seats
        binding.tvValPrice.text = "₹$price"

        applyStatusStyle(status, reason, name)

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

    fun updateStatus(status: String) {
        val reason = arguments?.getString("reason") ?: ""
        val name = arguments?.getString("name") ?: "—"
        arguments?.putString("status", status)
        
        activity?.runOnUiThread {
            if (_binding != null) {
                applyStatusStyle(status, reason, name)
            }
        }
    }

    private fun applyStatusStyle(status: String, reason: String, name: String) {
        val context = requireContext()
        when (status.lowercase()) {
            "approved", "valid", "success" -> {
                binding.ivStatusLogo.visibility = View.VISIBLE
                binding.tvStatusIndicatorEmoji.visibility = View.GONE
                
                binding.tvValidationTitle.text = "Valid QR Code"
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

                binding.tvValidationTitle.text = "Awaiting Approval"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.warning))
                binding.tvValidationSubtitle.text = "Payment Pending"
                
                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(ContextCompat.getColor(context, R.color.warning_bg))
                binding.tvErrorReasonHeader.text = "PENDING STATUS"
                binding.tvErrorReasonHeader.setTextColor(ContextCompat.getColor(context, R.color.warning))
                binding.tvErrorReasonText.text = reason.ifBlank { "This booking is valid but is currently pending organizer approval." }
            }
            else -> {
                binding.ivStatusLogo.visibility = View.GONE
                binding.tvStatusIndicatorEmoji.visibility = View.VISIBLE
                binding.tvStatusIndicatorEmoji.text = "✗"
                binding.tvStatusIndicatorEmoji.setTextColor(ContextCompat.getColor(context, R.color.danger))

                binding.tvValidationTitle.text = "Invalid QR Code"
                binding.tvValidationTitle.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvValidationSubtitle.text = "Entry Denied"
                
                if (name != "—" && name.isNotBlank() && name != "Unknown") {
                    binding.layoutAttendeeDetails.visibility = View.VISIBLE
                } else {
                    binding.layoutAttendeeDetails.visibility = View.GONE
                }
                
                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(ContextCompat.getColor(context, R.color.danger_bg))
                binding.tvErrorReasonHeader.text = "REJECTION DETAILS"
                binding.tvErrorReasonHeader.setTextColor(ContextCompat.getColor(context, R.color.danger))
                binding.tvErrorReasonText.text = reason.ifBlank { "This booking was explicitly rejected or does not exist." }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
