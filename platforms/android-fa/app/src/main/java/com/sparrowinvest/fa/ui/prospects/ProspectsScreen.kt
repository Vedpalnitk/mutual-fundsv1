package com.sparrowinvest.fa.ui.prospects

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.sparrowinvest.fa.data.model.MockProspects
import com.sparrowinvest.fa.data.model.Prospect
import com.sparrowinvest.fa.data.model.ProspectStage
import com.sparrowinvest.fa.ui.components.EmptyState
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.GlassTextField
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProspectsScreen(
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedStage by remember { mutableStateOf<ProspectStage?>(null) }
    var selectedProspect by remember { mutableStateOf<Prospect?>(null) }

    val allProspects = remember { mutableStateListOf(*MockProspects.prospects.toTypedArray()) }
    val filteredProspects = allProspects.filter { prospect ->
        val matchesSearch = searchQuery.isEmpty() ||
                prospect.name.contains(searchQuery, ignoreCase = true) ||
                prospect.email.contains(searchQuery, ignoreCase = true)
        val matchesStage = selectedStage == null || prospect.stage == selectedStage
        matchesSearch && matchesStage
    }

    val activeStages = listOf(
        ProspectStage.DISCOVERY,
        ProspectStage.ANALYSIS,
        ProspectStage.PROPOSAL,
        ProspectStage.NEGOTIATION
    )

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    Toast.makeText(context, "Add Prospect coming soon", Toast.LENGTH_SHORT).show()
                },
                containerColor = Primary
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add Prospect",
                    tint = Color.White
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            TopBar(
                title = "Prospects",
                onBackClick = onBackClick
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = Spacing.medium)
            ) {
                // Pipeline Summary
                PipelineSummary(prospects = allProspects)

                Spacer(modifier = Modifier.height(Spacing.compact))

                // Search
                GlassTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = "Search prospects...",
                    prefix = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                )

                Spacer(modifier = Modifier.height(Spacing.compact))

                // Stage filter chips
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    FilterChip(
                        selected = selectedStage == null,
                        onClick = { selectedStage = null },
                        label = { Text("All") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                        )
                    )
                    activeStages.forEach { stage ->
                        FilterChip(
                            selected = selectedStage == stage,
                            onClick = { selectedStage = stage },
                            label = { Text(stage.label) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primary,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(Spacing.compact))

                // Prospect list
                if (filteredProspects.isEmpty()) {
                    EmptyState(
                        title = "No prospects found",
                        message = "Try adjusting your search or filters",
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
                    ) {
                        items(filteredProspects, key = { it.id }) { prospect ->
                            ProspectItem(
                                prospect = prospect,
                                onClick = { selectedProspect = prospect }
                            )
                        }
                        item {
                            Spacer(modifier = Modifier.height(80.dp))
                        }
                    }
                }
            }
        }
    }

    // Prospect Detail Sheet
    if (selectedProspect != null) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { selectedProspect = null },
            sheetState = sheetState,
            shape = RoundedCornerShape(topStart = CornerRadius.xLarge, topEnd = CornerRadius.xLarge),
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            ProspectDetailSheetContent(
                prospect = selectedProspect!!,
                onDismiss = { selectedProspect = null },
                onSave = { updated ->
                    val index = allProspects.indexOfFirst { it.id == updated.id }
                    if (index >= 0) {
                        allProspects[index] = updated
                    }
                    selectedProspect = null
                }
            )
        }
    }
}

@Composable
private fun PipelineSummary(prospects: List<Prospect>) {
    val activeProspects = prospects.filter {
        it.stage != ProspectStage.CLOSED_WON && it.stage != ProspectStage.CLOSED_LOST
    }
    val totalPipelineValue = activeProspects.sumOf { it.potentialAum }
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN")).apply {
        maximumFractionDigits = 0
    }

    val stageCounts = mapOf(
        "Discovery" to activeProspects.count { it.stage == ProspectStage.DISCOVERY },
        "Analysis" to activeProspects.count { it.stage == ProspectStage.ANALYSIS },
        "Proposal" to activeProspects.count { it.stage == ProspectStage.PROPOSAL },
        "Negotiation" to activeProspects.count { it.stage == ProspectStage.NEGOTIATION }
    )

    GlassCard(cornerRadius = CornerRadius.large) {
        Column {
            Text(
                text = "Pipeline Overview",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(Spacing.small))
            Text(
                text = formatter.format(totalPipelineValue),
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "${activeProspects.size} active prospects",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(Spacing.compact))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                stageCounts.forEach { (stage, count) ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = count.toString(),
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = stage,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ProspectItem(
    prospect: Prospect,
    onClick: () -> Unit
) {
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN")).apply {
        maximumFractionDigits = 0
    }

    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = prospect.name,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(Spacing.small))
                StageBadge(stage = prospect.stage)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = prospect.email,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(Spacing.small))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Potential AUM",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatter.format(prospect.potentialAum),
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Next action",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = prospect.nextActionDate,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

@Composable
private fun ProspectDetailSheetContent(
    prospect: Prospect,
    onDismiss: () -> Unit,
    onSave: (Prospect) -> Unit
) {
    var newStage by remember { mutableStateOf(prospect.stage) }
    val stageChanged = newStage != prospect.stage

    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN")).apply {
        maximumFractionDigits = 0
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Spacing.medium)
            .padding(bottom = Spacing.large)
    ) {
        // Header: name + current badge
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = prospect.name,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.weight(1f)
            )
            Spacer(modifier = Modifier.width(Spacing.small))
            StageBadge(stage = prospect.stage)
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Contact & Details card
        GlassCard(cornerRadius = CornerRadius.large) {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.compact)) {
                DetailRow(label = "Email", value = prospect.email)
                DetailRow(label = "Phone", value = prospect.phone)
                DetailRow(label = "Source", value = prospect.source.label)
                DetailRow(label = "Potential AUM", value = formatter.format(prospect.potentialAum))
                DetailRow(label = "Probability", value = "${prospect.probability}%")
            }
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Stage Selector
        Text(
            text = "Change Stage",
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(Spacing.small))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            ProspectStage.entries.forEach { stage ->
                FilterChip(
                    selected = newStage == stage,
                    onClick = { newStage = stage },
                    label = { Text(stage.label) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = stageColor(stage),
                        selectedLabelColor = Color.White
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Next Action & Notes card
        GlassCard(cornerRadius = CornerRadius.large) {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.compact)) {
                DetailRow(label = "Next Action", value = prospect.nextAction)
                DetailRow(label = "Due Date", value = prospect.nextActionDate)
                Text(
                    text = "Notes",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = prospect.notes,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.large))

        // Bottom buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.weight(1f)
            ) {
                Text("Cancel")
            }
            Button(
                onClick = {
                    onSave(prospect.copy(stage = newStage))
                },
                enabled = stageChanged,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Primary
                ),
                shape = RoundedCornerShape(CornerRadius.medium)
            ) {
                Text("Save", color = Color.White)
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun StageBadge(stage: ProspectStage) {
    val (backgroundColor, textColor) = when (stage) {
        ProspectStage.DISCOVERY -> Secondary.copy(alpha = 0.15f) to Secondary
        ProspectStage.ANALYSIS -> Primary.copy(alpha = 0.15f) to Primary
        ProspectStage.PROPOSAL -> Color(0xFFF59E0B).copy(alpha = 0.15f) to Color(0xFFF59E0B)
        ProspectStage.NEGOTIATION -> Color(0xFFA855F7).copy(alpha = 0.15f) to Color(0xFFA855F7)
        ProspectStage.CLOSED_WON -> Success.copy(alpha = 0.15f) to Success
        ProspectStage.CLOSED_LOST -> Error.copy(alpha = 0.15f) to Error
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(backgroundColor)
            .padding(horizontal = Spacing.small, vertical = Spacing.micro)
    ) {
        Text(
            text = stage.label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = textColor
        )
    }
}

private fun stageColor(stage: ProspectStage): Color {
    return when (stage) {
        ProspectStage.DISCOVERY -> Secondary
        ProspectStage.ANALYSIS -> Primary
        ProspectStage.PROPOSAL -> Color(0xFFF59E0B)
        ProspectStage.NEGOTIATION -> Color(0xFFA855F7)
        ProspectStage.CLOSED_WON -> Success
        ProspectStage.CLOSED_LOST -> Error
    }
}
