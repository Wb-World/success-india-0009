package com.example.myapplication

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import com.example.myapplication.databinding.ActivityTicketBinding
import java.io.File
import java.io.FileOutputStream

class TicketActivity : AppCompatActivity() {
    private lateinit var binding: ActivityTicketBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTicketBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val qrData = intent.getStringExtra("QR_DATA") ?: "No Data"
        binding.tvTicketData.text = qrData

        binding.btnShare.setOnClickListener {
            shareTicket()
        }
    }

    private fun shareTicket() {
        val bitmap = createBitmapFromView(binding.ticketView)
        val uri = saveBitmapAndGetUri(bitmap)
        
        uri?.let {
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, it)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(Intent.createChooser(shareIntent, "Share Ticket via"))
        }
    }

    private fun createBitmapFromView(view: View): Bitmap {
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        view.draw(canvas)
        return bitmap
    }

    private fun saveBitmapAndGetUri(bitmap: Bitmap): Uri? {
        val imagesFolder = File(cacheDir, "images")
        try {
            imagesFolder.mkdirs()
            val file = File(imagesFolder, "ticket.png")
            val stream = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            stream.flush()
            stream.close()
            return FileProvider.getUriForFile(this, "${packageName}.provider", file)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }
}