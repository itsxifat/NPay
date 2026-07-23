package com.npay.collector.data

import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

/** Result of forwarding one SMS to the NPay server. */
data class IngestResult(val ok: Boolean, val status: String, val detail: String)

/** Minimal HTTP client (no third-party deps) for the ingest endpoint. */
object ApiClient {

    fun ingestSms(
        serverUrl: String,
        deviceKey: String,
        sender: String,
        body: String,
        receivedAt: Long,
    ): IngestResult {
        return try {
            val url = URL("$serverUrl/api/ingest/sms")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 15_000
                readTimeout = 15_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("x-device-key", deviceKey)
            }

            val payload = JSONObject().apply {
                put("sender", sender)
                put("body", body)
                put("receivedAt", receivedAt)
            }
            conn.outputStream.use { it.write(payload.toString().toByteArray()) }

            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val text = stream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
            conn.disconnect()

            if (code in 200..299) {
                val json = JSONObject(text)
                val status = json.optString("status", "OK")
                val trx = json.optJSONObject("transaction")
                val paid = json.optJSONObject("payment") != null
                val detail = buildString {
                    trx?.let { append(it.optString("trxId")) }
                    if (paid) append(" · payment matched")
                }
                IngestResult(true, status, detail.trim())
            } else {
                val err = runCatching { JSONObject(text).optString("error") }.getOrNull()
                IngestResult(false, "ERROR", err ?: "HTTP $code")
            }
        } catch (e: Exception) {
            IngestResult(false, "ERROR", e.message ?: "network error")
        }
    }
}
