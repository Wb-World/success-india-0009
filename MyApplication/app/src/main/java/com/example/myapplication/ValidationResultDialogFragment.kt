package com.example.myapplication

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.Window
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
            reason: String
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

        // Dismiss action on background tap or button tap
        binding.viewDismissDimResult.setOnClickListener { dismiss() }
        binding.btnDismissResult.setOnClickListener { dismiss() }

        // Start animating the entrance of the result card
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

        // Set text details
        binding.tvValAttendeeName.text = name
        binding.tvValSeminar.text = seminar
        binding.tvValVenue.text = venue
        binding.tvValSeats.text = seats
        binding.tvValPrice.text = "₹$price"

        // Configure look based on status
        when (status.lowercase()) {
            "approved" -> {
                binding.tvStatusIndicatorText.text = "✓"
                binding.tvValidationTitle.text = "Valid QR Code"
                binding.tvValidationTitle.setTextColor(Color.parseColor("#16a34a"))
                binding.tvValidationSubtitle.text = "Entry Authorized"
                
                binding.layoutStatusIconBg.setBackgroundResource(R.drawable.circle_primary_bg)
                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.GONE
            }
            "pending" -> {
                binding.tvStatusIndicatorText.text = "⏳"
                binding.tvValidationTitle.text = "Awaiting Approval"
                binding.tvValidationTitle.setTextColor(Color.parseColor("#f59e0b"))
                binding.tvValidationSubtitle.text = "Payment Pending"
                
                binding.layoutStatusIconBg.setBackgroundResource(0)
                binding.layoutStatusIconBg.setBackgroundColor(Color.parseColor("#FEF3C7"))
                binding.tvStatusIndicatorText.setTextColor(Color.parseColor("#d97706"))
                
                binding.layoutAttendeeDetails.visibility = View.VISIBLE
                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(Color.parseColor("#FEF3C7"))
                binding.tvErrorReasonHeader.text = "PENDING STATUS"
                binding.tvErrorReasonHeader.setTextColor(Color.parseColor("#d97706"))
                binding.tvErrorReasonText.text = reason
            }
            else -> { // Denied / Not Found / Error
                binding.tvStatusIndicatorText.text = "✗"
                binding.tvValidationTitle.text = "Invalid QR Code"
                binding.tvValidationTitle.setTextColor(Color.parseColor("#ef4444"))
                binding.tvValidationSubtitle.text = "Entry Denied"
                
                binding.layoutStatusIconBg.setBackgroundResource(R.drawable.circle_danger_bg)
                
                // Show attendee details only if a booking record was actually loaded
                if (name != "—" && name.isNotBlank() && name != "Unknown") {
                    binding.layoutAttendeeDetails.visibility = View.VISIBLE
                } else {
                    binding.layoutAttendeeDetails.visibility = View.GONE
                }
                
                binding.layoutErrorReason.visibility = View.VISIBLE
                binding.layoutErrorReason.setBackgroundColor(Color.parseColor("#FEE2E2"))
                binding.tvErrorReasonHeader.text = "REJECTION DETAILS"
                binding.tvErrorReasonHeader.setTextColor(Color.parseColor("#ef4444"))
                binding.tvErrorReasonText.text = reason
            }
        }

        // Animate the icon circle
        binding.layoutStatusIconBg.alpha = 0f
        binding.layoutStatusIconBg.scaleX = 0f
        binding.layoutStatusIconBg.scaleY = 0f
        binding.layoutStatusIconBg.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(500)
            .setStartDelay(200)
            .start()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
