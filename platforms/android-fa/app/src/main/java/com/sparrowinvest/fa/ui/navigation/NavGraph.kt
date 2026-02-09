package com.sparrowinvest.fa.ui.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.sparrowinvest.fa.ui.auth.AuthViewModel
import com.sparrowinvest.fa.ui.auth.LoginScreen
import com.sparrowinvest.fa.ui.clients.AddClientScreen
import com.sparrowinvest.fa.ui.clients.ClientDetailScreen
import com.sparrowinvest.fa.ui.clients.ClientsScreen
import com.sparrowinvest.fa.ui.dashboard.DashboardScreen
import com.sparrowinvest.fa.ui.insights.InsightsScreen
import com.sparrowinvest.fa.ui.sips.SipListScreen
import com.sparrowinvest.fa.ui.transactions.TransactionsScreen
import com.sparrowinvest.fa.ui.transactions.PlatformWebViewScreen
import com.sparrowinvest.fa.ui.transactions.TransactionPlatform
import com.sparrowinvest.fa.ui.funds.FundSearchScreen
import com.sparrowinvest.fa.ui.funds.FundDetailScreen
import com.sparrowinvest.fa.ui.clients.EditClientScreen
import com.sparrowinvest.fa.ui.transactions.ExecuteTradeScreen
import com.sparrowinvest.fa.ui.sips.CreateSipScreen
import com.sparrowinvest.fa.ui.settings.MoreScreen
import com.sparrowinvest.fa.ui.settings.HelpSupportScreen
import com.sparrowinvest.fa.ui.settings.NotificationsScreen
import com.sparrowinvest.fa.ui.settings.SecurityScreen
import com.sparrowinvest.fa.ui.settings.SettingsScreen
import com.sparrowinvest.fa.ui.transactions.TransactionDetailScreen
import com.sparrowinvest.fa.ui.chat.AvyaChatScreen

// Avya gradient colors (matching Dashboard)
private val AvyaGradient = Brush.linearGradient(
    colors = listOf(
        Color(0xFF6366F1), // Purple
        Color(0xFF3B82F6), // Blue
        Color(0xFF06B6D4)  // Cyan
    )
)

@Composable
fun NavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()

    val startDestination = if (isAuthenticated) Screen.Dashboard.route else Screen.Login.route

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Screens that show bottom nav
    val showBottomNav = currentRoute in listOf(
        Screen.Dashboard.route,
        Screen.Clients.route,
        Screen.Transactions.route,
        Screen.Insights.route,
        Screen.More.route
    )

    Scaffold(
        bottomBar = {
            if (showBottomNav) {
                BottomNavBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(Screen.Dashboard.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        },
        floatingActionButton = {
            // Show Avya FAB on main screens except Insights (which has integrated Avya)
            val showFab = showBottomNav && currentRoute != Screen.Insights.route
            if (showFab) {
                FloatingActionButton(
                    onClick = { navController.navigate(Screen.AvyaChat.route) },
                    modifier = Modifier.size(56.dp),
                    shape = CircleShape,
                    containerColor = Color.Transparent,
                    elevation = FloatingActionButtonDefaults.elevation(
                        defaultElevation = 6.dp,
                        pressedElevation = 8.dp
                    )
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(AvyaGradient, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✨",
                            style = androidx.compose.material3.MaterialTheme.typography.titleLarge
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            NavHost(
                navController = navController,
                startDestination = startDestination,
                enterTransition = {
                    slideIntoContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.Left,
                        animationSpec = tween(300)
                    )
                },
                exitTransition = {
                    slideOutOfContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.Left,
                        animationSpec = tween(300)
                    )
                },
                popEnterTransition = {
                    slideIntoContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.Right,
                        animationSpec = tween(300)
                    )
                },
                popExitTransition = {
                    slideOutOfContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.Right,
                        animationSpec = tween(300)
                    )
                }
            ) {
                // Auth
                composable(Screen.Login.route) {
                    LoginScreen(
                        viewModel = authViewModel,
                        onLoginSuccess = {
                            navController.navigate(Screen.Dashboard.route) {
                                popUpTo(Screen.Login.route) { inclusive = true }
                            }
                        }
                    )
                }

                // Main screens
                composable(Screen.Dashboard.route) {
                    DashboardScreen(
                        onNavigateToClient = { clientId ->
                            navController.navigate(Screen.ClientDetail.createRoute(clientId))
                        },
                        onNavigateToTransactions = {
                            // Use same navigation pattern as bottom nav to avoid stack issues
                            navController.navigate(Screen.Transactions.route) {
                                popUpTo(Screen.Dashboard.route) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        onNavigateToClients = {
                            // Use same navigation pattern as bottom nav
                            navController.navigate(Screen.Clients.route) {
                                popUpTo(Screen.Dashboard.route) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        onNavigateToAvyaChat = {
                            navController.navigate(Screen.AvyaChat.route)
                        }
                    )
                }

                composable(Screen.Clients.route) {
                    ClientsScreen(
                        onNavigateToClient = { clientId ->
                            navController.navigate(Screen.ClientDetail.createRoute(clientId))
                        },
                        onNavigateToAddClient = {
                            navController.navigate(Screen.AddClient.route)
                        }
                    )
                }

                // Add Client
                composable(Screen.AddClient.route) {
                    AddClientScreen(
                        onBackClick = { navController.popBackStack() },
                        onClientCreated = { clientId ->
                            // Navigate to the new client's detail page
                            navController.navigate(Screen.ClientDetail.createRoute(clientId)) {
                                popUpTo(Screen.Clients.route)
                            }
                        }
                    )
                }

                composable(Screen.Transactions.route) {
                    TransactionsScreen(
                        onNavigateToClient = { clientId ->
                            navController.navigate(Screen.ClientDetail.createRoute(clientId))
                        },
                        onNavigateToPlatform = { platformId ->
                            navController.navigate(Screen.PlatformWebView.createRoute(platformId))
                        },
                        onNavigateToTransaction = { transactionId ->
                            navController.navigate(Screen.TransactionDetail.createRoute(transactionId))
                        }
                    )
                }

                composable(Screen.Insights.route) {
                    InsightsScreen(
                        onNavigateToClient = { clientId ->
                            navController.navigate(Screen.ClientDetail.createRoute(clientId))
                        },
                        onNavigateToChat = { query ->
                            navController.navigate(Screen.AvyaChat.createRoute(query))
                        }
                    )
                }

                composable(Screen.More.route) {
                    MoreScreen(
                        onNavigateToSips = {
                            navController.navigate(Screen.SipList.route)
                        },
                        onNavigateToSettings = {
                            navController.navigate(Screen.Settings.route)
                        },
                        onNavigateToNotifications = {
                            navController.navigate(Screen.Notifications.route)
                        },
                        onNavigateToSecurity = {
                            navController.navigate(Screen.Security.route)
                        },
                        onNavigateToHelp = {
                            navController.navigate(Screen.HelpSupport.route)
                        },
                        onLogout = {
                            authViewModel.logout()
                            navController.navigate(Screen.Login.route) {
                                popUpTo(Screen.Dashboard.route) { inclusive = true }
                            }
                        }
                    )
                }

                // Avya Chat
                composable(
                    route = Screen.AvyaChat.route,
                    arguments = listOf(
                        navArgument(NavArguments.QUERY) {
                            type = NavType.StringType
                            nullable = true
                            defaultValue = null
                        }
                    )
                ) { backStackEntry ->
                    val encodedQuery = backStackEntry.arguments?.getString(NavArguments.QUERY)
                    val initialQuery = encodedQuery?.let {
                        try {
                            java.net.URLDecoder.decode(it, "UTF-8")
                        } catch (e: Exception) {
                            null
                        }
                    }
                    AvyaChatScreen(
                        onBackClick = { navController.popBackStack() },
                        initialQuery = initialQuery
                    )
                }

                // Platform WebView (BSE Star MF / MFU)
                composable(
                    route = Screen.PlatformWebView.route,
                    arguments = listOf(
                        navArgument(NavArguments.PLATFORM_ID) { type = NavType.StringType }
                    )
                ) { backStackEntry ->
                    val platformId = backStackEntry.arguments?.getString(NavArguments.PLATFORM_ID) ?: ""
                    val platform = when (platformId) {
                        "bse" -> TransactionPlatform.BSE_STAR_MF
                        "mfu" -> TransactionPlatform.MFU
                        else -> TransactionPlatform.BSE_STAR_MF
                    }
                    PlatformWebViewScreen(
                        platform = platform,
                        onNavigateBack = { navController.popBackStack() }
                    )
                }

                // Detail screens
                composable(
                    route = Screen.ClientDetail.route,
                    arguments = listOf(
                        navArgument(NavArguments.CLIENT_ID) { type = NavType.StringType }
                    )
                ) { backStackEntry ->
                    val clientId = backStackEntry.arguments?.getString(NavArguments.CLIENT_ID) ?: ""
                    ClientDetailScreen(
                        clientId = clientId,
                        onBackClick = { navController.popBackStack() },
                        onNavigateToFund = { schemeCode ->
                            navController.navigate(Screen.FundDetail.createRoute(schemeCode))
                        },
                        onNavigateToExecuteTrade = {
                            navController.navigate(Screen.ExecuteTrade.createRoute(clientId))
                        },
                        onNavigateToCreateSip = {
                            navController.navigate(Screen.CreateSip.createRoute(clientId))
                        },
                        onNavigateToEditClient = {
                            navController.navigate(Screen.EditClient.createRoute(clientId))
                        }
                    )
                }

                // SIP List
                composable(Screen.SipList.route) {
                    SipListScreen(
                        onBackClick = { navController.popBackStack() },
                        onNavigateToClient = { clientId ->
                            navController.navigate(Screen.ClientDetail.createRoute(clientId))
                        }
                    )
                }

                // Fund Search
                composable(Screen.FundSearch.route) {
                    FundSearchScreen(
                        onBackClick = { navController.popBackStack() },
                        onSelectFund = { schemeCode ->
                            navController.navigate(Screen.FundDetail.createRoute(schemeCode))
                        }
                    )
                }

                // Fund Detail
                composable(
                    route = Screen.FundDetail.route,
                    arguments = listOf(
                        navArgument(NavArguments.SCHEME_CODE) { type = NavType.StringType }
                    )
                ) { backStackEntry ->
                    val schemeCode = backStackEntry.arguments?.getString(NavArguments.SCHEME_CODE)?.toIntOrNull() ?: 0
                    FundDetailScreen(
                        schemeCode = schemeCode,
                        onBackClick = { navController.popBackStack() }
                    )
                }

                // Edit Client
                composable(
                    route = Screen.EditClient.route,
                    arguments = listOf(
                        navArgument(NavArguments.CLIENT_ID) { type = NavType.StringType }
                    )
                ) { backStackEntry ->
                    val clientId = backStackEntry.arguments?.getString(NavArguments.CLIENT_ID) ?: ""
                    EditClientScreen(
                        clientId = clientId,
                        onBackClick = { navController.popBackStack() },
                        onClientUpdated = { navController.popBackStack() }
                    )
                }

                // Execute Trade
                composable(
                    route = Screen.ExecuteTrade.route,
                    arguments = listOf(
                        navArgument(NavArguments.CLIENT_ID) { type = NavType.StringType }
                    )
                ) { backStackEntry ->
                    val clientId = backStackEntry.arguments?.getString(NavArguments.CLIENT_ID) ?: ""
                    ExecuteTradeScreen(
                        clientId = clientId,
                        onBackClick = { navController.popBackStack() },
                        onTradeSuccess = { navController.popBackStack() }
                    )
                }

                // Create SIP
                composable(
                    route = Screen.CreateSip.route,
                    arguments = listOf(
                        navArgument(NavArguments.CLIENT_ID) { type = NavType.StringType }
                    )
                ) { backStackEntry ->
                    val clientId = backStackEntry.arguments?.getString(NavArguments.CLIENT_ID) ?: ""
                    CreateSipScreen(
                        clientId = clientId,
                        onBackClick = { navController.popBackStack() },
                        onSipCreated = { navController.popBackStack() }
                    )
                }

                // Transaction Detail
                composable(
                    route = Screen.TransactionDetail.route,
                    arguments = listOf(
                        navArgument(NavArguments.TRANSACTION_ID) { type = NavType.StringType }
                    )
                ) { backStackEntry ->
                    val transactionId = backStackEntry.arguments?.getString(NavArguments.TRANSACTION_ID) ?: ""
                    TransactionDetailScreen(
                        transactionId = transactionId,
                        onBackClick = { navController.popBackStack() },
                        onNavigateToClient = { clientId ->
                            navController.navigate(Screen.ClientDetail.createRoute(clientId))
                        }
                    )
                }

                // Settings
                composable(Screen.Settings.route) {
                    SettingsScreen(
                        onBackClick = { navController.popBackStack() }
                    )
                }

                // Notifications
                composable(Screen.Notifications.route) {
                    NotificationsScreen(
                        onBackClick = { navController.popBackStack() }
                    )
                }

                // Security
                composable(Screen.Security.route) {
                    SecurityScreen(
                        onBackClick = { navController.popBackStack() }
                    )
                }

                // Help & Support
                composable(Screen.HelpSupport.route) {
                    HelpSupportScreen(
                        onBackClick = { navController.popBackStack() }
                    )
                }
            }
        }
    }
}
