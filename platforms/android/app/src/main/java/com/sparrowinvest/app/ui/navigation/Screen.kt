package com.sparrowinvest.app.ui.navigation

sealed class Screen(val route: String) {
    // Auth screens
    data object Welcome : Screen("welcome")
    data object Login : Screen("login")
    data object Signup : Screen("signup")

    // Main screens
    data object Home : Screen("home")
    data object Investments : Screen("investments")
    data object Explore : Screen("explore")
    data object Insights : Screen("insights")
    data object Profile : Screen("profile")

    // Detail screens
    data object FundDetail : Screen("fund/{schemeCode}") {
        fun createRoute(schemeCode: Int) = "fund/$schemeCode"
    }
    data object HoldingDetail : Screen("holding/{holdingId}") {
        fun createRoute(holdingId: String) = "holding/$holdingId"
    }
    data object TransactionHistory : Screen("transactions")
    data object SipList : Screen("sips")

    // Goals
    data object Goals : Screen("goals")
    data object GoalDetail : Screen("goal/{goalId}") {
        fun createRoute(goalId: String) = "goal/$goalId"
    }
    data object CreateGoal : Screen("goal/create")

    // Settings
    data object Settings : Screen("settings")
    data object NotificationSettings : Screen("settings/notifications")
    data object SecuritySettings : Screen("settings/security")

    // AI/Analysis
    data object PortfolioAnalysis : Screen("analysis")
    data object Recommendations : Screen("recommendations")
}

object NavArguments {
    const val SCHEME_CODE = "schemeCode"
    const val HOLDING_ID = "holdingId"
    const val GOAL_ID = "goalId"
}
