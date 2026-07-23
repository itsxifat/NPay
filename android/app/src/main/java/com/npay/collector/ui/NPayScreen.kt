package com.npay.collector.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.npay.collector.data.EventLog
import com.npay.collector.data.ForwardEvent
import com.npay.collector.data.Prefs
import androidx.compose.ui.platform.LocalContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NPayScreen(
    isDefaultSmsApp: Boolean,
    onRequestDefault: () -> Unit,
    onSaveConfig: (String, String) -> Unit,
) {
    val context = LocalContext.current
    val prefs = remember { Prefs.get(context) }
    val config by prefs.config.collectAsState(initial = null)
    val events by EventLog.events.collectAsState()

    var serverUrl by rememberSaveable { mutableStateOf("") }
    var deviceKey by rememberSaveable { mutableStateOf("") }
    var seeded by remember { mutableStateOf(false) }

    LaunchedEffect(config) {
        val c = config
        if (c != null && !seeded) {
            serverUrl = c.serverUrl
            deviceKey = c.deviceKey
            seeded = true
        }
    }

    Scaffold(containerColor = MaterialTheme.colorScheme.background) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Header()

            StatusCard(
                configured = config?.isConfigured == true,
                isDefaultSmsApp = isDefaultSmsApp,
                onRequestDefault = onRequestDefault,
            )

            EnrollCard(
                serverUrl = serverUrl,
                deviceKey = deviceKey,
                onServerUrl = { serverUrl = it },
                onDeviceKey = { deviceKey = it },
                onSave = { onSaveConfig(serverUrl, deviceKey) },
            )

            ActivityCard(events)
        }
    }
}

@Composable
private fun Header() {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(
            Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Brush.linearGradient(listOf(BkashPink, BkashDeep))),
            contentAlignment = Alignment.Center,
        ) {
            Text("N", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
        }
        Column {
            Text(
                buildString { append("NPay") },
                fontWeight = FontWeight.ExtraBold,
                fontSize = 22.sp,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text("bKash payment collector", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
        }
    }
}

@Composable
private fun StatusCard(configured: Boolean, isDefaultSmsApp: Boolean, onRequestDefault: () -> Unit) {
    Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Setup", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface)
            StatusRow("Enrolled with server", configured)
            StatusRow("Default SMS app", isDefaultSmsApp)
            if (!isDefaultSmsApp) {
                Button(
                    onClick = onRequestDefault,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = BkashPink),
                    shape = RoundedCornerShape(12.dp),
                ) { Text("Set NPay as default SMS app", fontWeight = FontWeight.SemiBold) }
                Text(
                    "Required so every SMS on every SIM is delivered to NPay for verification.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun StatusRow(label: String, ok: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(
            Modifier.size(20.dp).clip(CircleShape).background(if (ok) Color(0xFF10B981) else Color(0xFFE5E3EC)),
            contentAlignment = Alignment.Center,
        ) { Text(if (ok) "✓" else "!", color = if (ok) Color.White else InkSoft, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
        Text(label, color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EnrollCard(
    serverUrl: String,
    deviceKey: String,
    onServerUrl: (String) -> Unit,
    onDeviceKey: (String) -> Unit,
    onSave: () -> Unit,
) {
    Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Enrollment", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface)
            OutlinedTextField(
                value = serverUrl,
                onValueChange = onServerUrl,
                label = { Text("Server URL") },
                placeholder = { Text("https://your-npay-server.com") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                shape = RoundedCornerShape(12.dp),
            )
            OutlinedTextField(
                value = deviceKey,
                onValueChange = onDeviceKey,
                label = { Text("Device key") },
                placeholder = { Text("dev_...") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
            )
            Button(
                onClick = onSave,
                modifier = Modifier.fillMaxWidth(),
                enabled = serverUrl.isNotBlank() && deviceKey.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = BkashPink),
                shape = RoundedCornerShape(12.dp),
            ) { Text("Save enrollment", fontWeight = FontWeight.SemiBold) }
            Text(
                "Get the device key from Dashboard → Devices → Enroll device.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun ActivityCard(events: List<ForwardEvent>) {
    Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(18.dp)) {
            Text("Recent activity", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface)
            Spacer(Modifier.height(8.dp))
            if (events.isEmpty()) {
                Text(
                    "Forwarded payment SMS will appear here.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 12.dp),
                )
            } else {
                LazyColumn(Modifier.heightIn(max = 320.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(events) { EventRow(it) }
                }
            }
        }
    }
}

@Composable
private fun EventRow(event: ForwardEvent) {
    val time = remember(event.timestamp) {
        SimpleDateFormat("dd MMM, HH:mm", Locale.getDefault()).format(Date(event.timestamp))
    }
    val (bg, fg) = when (event.outcome) {
        "VERIFIED" -> Color(0xFFDCFCE7) to Color(0xFF047857)
        "UNRECONCILED", "ERROR" -> Color(0xFFFFE4E6) to Color(0xFFBE123C)
        "DUPLICATE" -> Color(0xFFF1F5F9) to Color(0xFF475569)
        else -> BkashTint to BkashDeep
    }
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(MaterialTheme.colorScheme.background).padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(event.preview, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text("$time · ${event.sender}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (event.detail.isNotBlank()) {
                Text(event.detail, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        Box(Modifier.clip(RoundedCornerShape(8.dp)).background(bg).padding(horizontal = 10.dp, vertical = 4.dp)) {
            Text(event.outcome, color = fg, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}
