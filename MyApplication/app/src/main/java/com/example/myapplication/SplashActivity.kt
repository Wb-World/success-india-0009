package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.example.myapplication.databinding.ActivitySplashBinding

class SplashActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySplashBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Make elements invisible initially for animation
        binding.cardLogo.alpha = 0f
        binding.cardLogo.scaleX = 0.5f
        binding.cardLogo.scaleY = 0.5f

        binding.tvSplashTitle.alpha = 0f
        binding.tvSplashTitle.translationY = 50f

        binding.tvSplashSubtitle.alpha = 0f
        binding.tvSplashSubtitle.translationY = 30f

        // Start logo scale and fade-in animation
        binding.cardLogo.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(1200)
            .withEndAction {
                // Animate text elements after logo finishes
                binding.tvSplashTitle.animate()
                    .alpha(1f)
                    .translationY(0f)
                    .setDuration(600)
                    .start()

                binding.tvSplashSubtitle.animate()
                    .alpha(1f)
                    .translationY(0f)
                    .setDuration(800)
                    .start()
            }
            .start()

        // Navigate to MainActivity after 2.5 seconds
        Handler(Looper.getMainLooper()).postDelayed({
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
            @Suppress("DEPRECATION")
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }, 2700)
    }
}
