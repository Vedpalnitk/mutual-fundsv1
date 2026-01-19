package com.sparrowinvest.app.ui.auth

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
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
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.sparrowinvest.app.ui.components.LinkButton
import com.sparrowinvest.app.ui.components.PagerIndicator
import com.sparrowinvest.app.ui.components.PrimaryButton
import com.sparrowinvest.app.ui.theme.Primary
import com.sparrowinvest.app.ui.theme.Spacing
import com.sparrowinvest.app.ui.theme.Success
import kotlinx.coroutines.launch

data class OnboardingPage(
    val icon: ImageVector,
    val iconColor: Color,
    val title: String,
    val description: String,
    val features: List<String>
)

val onboardingPages = listOf(
    OnboardingPage(
        icon = Icons.Default.AutoAwesome,
        iconColor = Primary,
        title = "AI-Powered Recommendations",
        description = "Get personalized mutual fund recommendations based on your goals, risk profile, and market conditions.",
        features = listOf(
            "Goal-based portfolio allocation",
            "Real-time market insights",
            "Risk-adjusted recommendations"
        )
    ),
    OnboardingPage(
        icon = Icons.Default.Groups,
        iconColor = Color(0xFF06B6D4), // Cyan
        title = "Family Portfolio Management",
        description = "Track and manage investments for your entire family in one place with a consolidated view.",
        features = listOf(
            "Individual & family portfolios",
            "Joint investment tracking",
            "Financial goal planning for all"
        )
    ),
    OnboardingPage(
        icon = Icons.Default.VerifiedUser,
        iconColor = Success,
        title = "Expert Fund Advisors",
        description = "Connect with SEBI-registered investment advisors for personalized guidance and tax planning.",
        features = listOf(
            "Certified advisors",
            "One-on-one consultations",
            "Tax-optimized strategies"
        )
    )
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun WelcomeScreen(
    onGetStarted: () -> Unit,
    onLoginClick: () -> Unit,
    onSkip: () -> Unit = {}
) {
    val pagerState = rememberPagerState(pageCount = { onboardingPages.size })
    val coroutineScope = rememberCoroutineScope()
    val isLastPage = pagerState.currentPage == onboardingPages.size - 1

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
            .padding(Spacing.large),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top bar with Skip button
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            TextButton(onClick = onSkip) {
                Text(
                    text = "Skip",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Logo/Brand
        Text(
            text = "Sparrow Invest",
            style = MaterialTheme.typography.headlineLarge,
            color = Primary
        )

        Spacer(modifier = Modifier.height(Spacing.xxLarge))

        // Pager
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) { page ->
            OnboardingPageView(page = onboardingPages[page])
        }

        // Pager Indicator
        PagerIndicator(
            pageCount = onboardingPages.size,
            currentPage = pagerState.currentPage
        )

        Spacer(modifier = Modifier.height(Spacing.xxLarge))

        // Next / Get Started Button
        PrimaryButton(
            text = if (isLastPage) "Get Started" else "Next",
            onClick = {
                if (isLastPage) {
                    onGetStarted()
                } else {
                    coroutineScope.launch {
                        pagerState.animateScrollToPage(pagerState.currentPage + 1)
                    }
                }
            }
        )

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Already have account
        LinkButton(
            text = "Already have an account? Sign In",
            onClick = onLoginClick
        )

        Spacer(modifier = Modifier.height(Spacing.large))
    }
}

@Composable
private fun OnboardingPageView(page: OnboardingPage) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Spacing.medium),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Icon container
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(
                    color = page.iconColor.copy(alpha = 0.1f),
                    shape = MaterialTheme.shapes.large
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = page.icon,
                contentDescription = null,
                modifier = Modifier.size(60.dp),
                tint = page.iconColor
            )
        }

        Spacer(modifier = Modifier.height(Spacing.xxLarge))

        // Title
        Text(
            text = page.title,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Description
        Text(
            text = page.description,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(Spacing.large))

        // Features list
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            page.features.forEach { feature ->
                FeatureItem(text = feature, color = page.iconColor)
            }
        }
    }
}

@Composable
private fun FeatureItem(text: String, color: Color) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(horizontal = Spacing.large)
    ) {
        Icon(
            imageVector = Icons.Default.Check,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = color
        )
        Spacer(modifier = Modifier.width(Spacing.small))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
