package com.sparrowinvest.fa.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.sparrowinvest.fa.ui.clients.ShareWithClientSheet
import com.sparrowinvest.fa.ui.theme.Primary

@Composable
fun ShareWithClientButton(
    clientId: String,
    clientName: String,
    defaultType: String? = null,
    contextData: kotlinx.serialization.json.JsonObject? = null,
    content: @Composable (() -> Unit) -> Unit = { onClick ->
        IconButton(onClick = onClick) {
            Icon(
                imageVector = Icons.Default.Share,
                contentDescription = "Share with client",
                tint = Primary
            )
        }
    }
) {
    var showSheet by remember { mutableStateOf(false) }

    content { showSheet = true }

    if (showSheet) {
        ShareWithClientSheet(
            clientId = clientId,
            clientName = clientName,
            defaultType = defaultType,
            contextData = contextData,
            onDismiss = { showSheet = false }
        )
    }
}
