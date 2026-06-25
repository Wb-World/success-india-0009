package com.example.myapplication

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.myapplication.databinding.ActivityScannerBinding
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult

class ScannerActivity : AppCompatActivity() {
    private lateinit var binding: ActivityScannerBinding
    private val CAMERA_PERMISSION_CODE = 101

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScannerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (checkPermission()) {
            startScanner()
        } else {
            requestPermission()
        }
    }

    private fun checkPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestPermission() {
        ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), CAMERA_PERMISSION_CODE)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startScanner()
            } else {
                Toast.makeText(this, "Camera permission is required to scan QR code", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun startScanner() {
        binding.barcodeScanner.decodeContinuous(object : BarcodeCallback {
            override fun barcodeResult(result: BarcodeResult?) {
                result?.let {
                    binding.barcodeScanner.pause()
                    val data = it.text
                    if (isValidSuccessTeamData(data)) {
                        showResultDialog(data)
                    } else {
                        showInvalidDataDialog()
                    }
                }
            }
        })
    }

    private fun isValidSuccessTeamData(data: String): Boolean {
        // Intelligent validation: check if data is from accsysindia.com or contains specific keywords
        return data.contains("accsysindia.com", ignoreCase = true) || 
               data.contains("SUCCESS TEAM", ignoreCase = true)
    }

    private fun showInvalidDataDialog() {
        AlertDialog.Builder(this)
            .setTitle("Validation Failed")
            .setMessage("This QR code is not recognized as a valid Success Team resource.")
            .setPositiveButton("Retry") { _, _ ->
                binding.barcodeScanner.resume()
            }
            .setNegativeButton("Cancel") { _, _ ->
                finish()
            }
            .setCancelable(false)
            .show()
    }

    private fun showResultDialog(data: String) {
        AlertDialog.Builder(this)
            .setTitle("Success Team Verified")
            .setMessage("Information Extracted:\n$data")
            .setPositiveButton("View Ticket") { _, _ ->
                val intent = Intent(this, TicketActivity::class.java)
                intent.putExtra("QR_DATA", data)
                startActivity(intent)
                finish()
            }
            .setNegativeButton("Scan Again") { _, _ ->
                binding.barcodeScanner.resume()
            }
            .setCancelable(false)
            .show()
    }

    override fun onResume() {
        super.onResume()
        binding.barcodeScanner.resume()
    }

    override fun onPause() {
        super.onPause()
        binding.barcodeScanner.pause()
    }
}