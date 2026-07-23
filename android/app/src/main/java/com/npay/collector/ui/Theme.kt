package com.npay.collector.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// bKash brand palette.
val BkashPink = Color(0xFFE2136E)
val BkashDark = Color(0xFFB70E58)
val BkashDeep = Color(0xFF8A0A43)
val BkashTint = Color(0xFFFDE7F1)
val Ink = Color(0xFF151320)
val InkSoft = Color(0xFF5A5670)

private val Light = lightColorScheme(
    primary = BkashPink,
    onPrimary = Color.White,
    primaryContainer = BkashTint,
    onPrimaryContainer = BkashDeep,
    secondary = BkashDark,
    background = Color(0xFFF7F6FB),
    surface = Color.White,
    onSurface = Ink,
    onSurfaceVariant = InkSoft,
)

private val Dark = darkColorScheme(
    primary = BkashPink,
    onPrimary = Color.White,
    primaryContainer = BkashDeep,
    onPrimaryContainer = BkashTint,
    background = Color(0xFF120E16),
    surface = Color(0xFF1C1722),
    onSurface = Color(0xFFF3F0F7),
)

@Composable
fun NPayTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) Dark else Light,
        content = content,
    )
}
