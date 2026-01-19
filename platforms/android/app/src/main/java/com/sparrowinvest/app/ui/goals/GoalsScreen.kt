package com.sparrowinvest.app.ui.goals

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.app.data.model.Goal
import com.sparrowinvest.app.ui.components.CurrencyText
import com.sparrowinvest.app.ui.components.EmptyState
import com.sparrowinvest.app.ui.components.FullScreenLoading
import com.sparrowinvest.app.ui.components.GlassCard
import com.sparrowinvest.app.ui.components.TopBar
import com.sparrowinvest.app.ui.theme.CornerRadius
import com.sparrowinvest.app.ui.theme.Primary
import com.sparrowinvest.app.ui.theme.Spacing
import java.util.Locale

@Composable
fun GoalsScreen(
    viewModel: GoalsViewModel = hiltViewModel(),
    onNavigateToGoal: (String) -> Unit,
    onCreateGoal: () -> Unit,
    onBackClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val goals by viewModel.goals.collectAsState()

    Scaffold(
        topBar = {
            TopBar(
                title = "Goals",
                onBackClick = onBackClick,
                modifier = Modifier.statusBarsPadding()
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onCreateGoal,
                containerColor = Primary
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Create Goal",
                    tint = Color.White
                )
            }
        }
    ) { paddingValues ->
        when (uiState) {
            is GoalsUiState.Loading -> {
                FullScreenLoading(modifier = Modifier.padding(paddingValues))
            }
            is GoalsUiState.Success -> {
                if (goals.isEmpty()) {
                    EmptyState(
                        icon = Icons.Default.Flag,
                        title = "No goals yet",
                        message = "Create your first financial goal to start tracking your progress",
                        modifier = Modifier.padding(paddingValues)
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(Spacing.medium),
                        verticalArrangement = Arrangement.spacedBy(Spacing.medium)
                    ) {
                        items(goals) { goal ->
                            GoalCard(
                                goal = goal,
                                onClick = { onNavigateToGoal(goal.id) }
                            )
                        }
                    }
                }
            }
            is GoalsUiState.Error -> {
                // Error state
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GoalCard(
    goal: Goal,
    onClick: () -> Unit
) {
    GlassCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(CornerRadius.medium))
                        .background(Color(goal.category.color).copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = goal.category.icon,
                        contentDescription = null,
                        tint = Color(goal.category.color),
                        modifier = Modifier.size(24.dp)
                    )
                }

                Spacer(modifier = Modifier.width(Spacing.medium))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = goal.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = goal.category.displayName,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "${String.format(Locale.US, "%.0f", goal.progressPercentage)}%",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(goal.category.color)
                    )
                    if (goal.isCompleted) {
                        Text(
                            text = "Completed",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(goal.category.color)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Progress bar
            LinearProgressIndicator(
                progress = (goal.progressPercentage / 100).toFloat().coerceIn(0f, 1f),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = Color(goal.category.color),
                trackColor = Color(goal.category.color).copy(alpha = 0.15f)
            )

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Amount info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Current",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    CurrencyText(
                        amount = goal.currentAmount,
                        style = MaterialTheme.typography.bodyMedium,
                        compact = true
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Target",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    CurrencyText(
                        amount = goal.targetAmount,
                        style = MaterialTheme.typography.bodyMedium,
                        compact = true
                    )
                }
            }

            // Monthly SIP info
            goal.monthlySip?.let { sip ->
                Spacer(modifier = Modifier.height(Spacing.compact))
                Text(
                    text = "Monthly SIP: ${String.format(Locale.US, "₹%.0f", sip)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
