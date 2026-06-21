package com.example.myapplication

import android.animation.ValueAnimator
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.Window
import androidx.fragment.app.DialogFragment
import com.example.myapplication.databinding.DialogQrScannerBinding
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult

class QRScannerDialogFragment : DialogFragment() {

    interface QRScannerListener {
        fun onQRScanned(data: String)
    }

    private var _binding: DialogQrScannerBinding? = null
    private val binding get() = _binding!!
    private var listener: QRScannerListener? = null
    private var laserAnimator: ValueAnimator? = null

    fun setScannerListener(listener: QRScannerListener) {
        this.listener = listener
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Set dialog style to translucent full screen to cover status bar nicely
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
        _binding = DialogQrScannerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Dim background tap finishes the scanner dialog
        binding.viewDismissDim.setOnClickListener { dismiss() }
        binding.btnDismissScanner.setOnClickListener { dismiss() }

        // Start QR reader
        startDecoding()

        // Start laser line sweep animation
        startLaserAnimation()
    }

    private fun startDecoding() {
        binding.dialogBarcodeScanner.decodeContinuous(object : BarcodeCallback {
            override fun barcodeResult(result: BarcodeResult?) {
                result?.let {
                    // Pause camera stream immediately on first match to avoid multiple triggers
                    binding.dialogBarcodeScanner.pause()
                    listener?.onQRScanned(it.text)
                    dismiss()
                }
            }
        })
    }

    private fun startLaserAnimation() {
        binding.viewScannerLaser.post {
            val totalTravelDistance = binding.cardScannerContainer.height - binding.viewScannerLaser.height
            if (totalTravelDistance > 0) {
                laserAnimator = ValueAnimator.ofFloat(0f, totalTravelDistance.toFloat()).apply {
                    duration = 2000
                    repeatMode = ValueAnimator.REVERSE
                    repeatCount = ValueAnimator.INFINITE
                    addUpdateListener { animation ->
                        binding.viewScannerLaser.translationY = animation.animatedValue as Float
                    }
                    start()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        binding.dialogBarcodeScanner.resume()
    }

    override fun onPause() {
        super.onPause()
        binding.dialogBarcodeScanner.pause()
        laserAnimator?.cancel()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
