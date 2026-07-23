package com.npay.collector.sms

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import com.npay.collector.MainActivity

/**
 * Required compose/send activity for default-SMS-app eligibility. NPay is not a
 * messaging client, so if the OS routes a "compose SMS" intent here we simply
 * redirect the user to the app's main screen.
 */
class ComposeSmsActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
