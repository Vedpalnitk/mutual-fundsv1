package com.sparrowinvest.app.ui.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
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
import com.sparrowinvest.app.ui.auth.AuthViewModel
import com.sparrowinvest.app.ui.auth.LoginScreen
import com.sparrowinvest.app.ui.auth.SignupScreen
import com.sparrowinvest.app.ui.auth.WelcomeScreen
import com.sparrowinvest.app.ui.explore.ExploreScreen
import com.sparrowinvest.app.ui.explore.FundDetailScreen
import com.sparrowinvest.app.ui.goals.GoalDetailScreen
import com.sparrowinvest.app.ui.goals.GoalsScreen
import com.sparrowinvest.app.ui.home.HomeScreen
import com.sparrowinvest.app.ui.insights.InsightsScreen
import com.sparrowinvest.app.ui.investments.InvestmentsScreen
import com.sparrowinvest.app.ui.profile.ProfileScreen

@Composable
fun NavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()
    val hasCompletedOnboarding by authViewModel.hasCompletedOnboarding.collectAsState()

    val startDestination = when {
        isAuthenticated -> Screen.Home.route
        hasCompletedOnboarding -> Screen.Login.route
        else -> Screen.Welcome.route
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Screens that show bottom nav
    val showBottomNav = currentRoute in listOf(
        Screen.Home.route,
        Screen.Investments.route,
        Screen.Explore.route,
        Screen.Insights.route,
        Screen.Profile.route
    )

    Scaffold(
        bottomBar = {
            if (showBottomNav) {
                BottomNavBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
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
                // Auth Flow
                composable(Screen.Welcome.route) {
                    WelcomeScreen(
                        onGetStarted = {
                            authViewModel.setOnboardingCompleted()
                            navController.navigate(Screen.Signup.route) {
                                popUpTo(Screen.Welcome.route) { inclusive = true }
                            }
                        },
                        onLoginClick = {
                            navController.navigate(Screen.Login.route)
                        },
                        onSkip = {
                            authViewModel.continueAsGuest()
                            navController.navigate(Screen.Home.route) {
                                popUpTo(Screen.Welcome.route) { inclusive = true }
                            }
                        }
                    )
                }

                composable(Screen.Login.route) {
                    LoginScreen(
                        viewModel = authViewModel,
                        onLoginSuccess = {
                            navController.navigate(Screen.Home.route) {
                                popUpTo(Screen.Welcome.route) { inclusive = true }
                            }
                        },
                        onSignupClick = {
                            navController.navigate(Screen.Signup.route)
                        },
                        onSkip = {
                            authViewModel.continueAsGuest()
                            navController.navigate(Screen.Home.route) {
                                popUpTo(Screen.Welcome.route) { inclusive = true }
                            }
                        },
                        onBackClick = {
                            navController.popBackStack()
                        }
                    )
                }

                composable(Screen.Signup.route) {
                    SignupScreen(
                        viewModel = authViewModel,
                        onSignupComplete = {
                            navController.navigate(Screen.Home.route) {
                                popUpTo(Screen.Welcome.route) { inclusive = true }
                            }
                        },
                        onLoginClick = {
                            navController.navigate(Screen.Login.route) {
                                popUpTo(Screen.Signup.route) { inclusive = true }
                            }
                        },
                        onBackClick = {
                            navController.popBackStack()
                        }
                    )
                }

                // Main screens
                composable(Screen.Home.route) {
                    HomeScreen(
                        onNavigateToInvestments = {
                            navController.navigate(Screen.Investments.route)
                        },
                        onNavigateToFund = { schemeCode ->
                            navController.navigate(Screen.FundDetail.createRoute(schemeCode))
                        },
                        onNavigateToGoals = {
                            navController.navigate(Screen.Goals.route)
                        },
                        onNavigateToAnalysis = {
                            navController.navigate(Screen.Insights.route)
                        }
                    )
                }

                composable(Screen.Investments.route) {
                    InvestmentsScreen(
                        onNavigateToFund = { schemeCode ->
                            navController.navigate(Screen.FundDetail.createRoute(schemeCode))
                        },
                        onNavigateToTransactions = {
                            navController.navigate(Screen.TransactionHistory.route)
                        }
                    )
                }

                composable(Screen.Explore.route) {
                    ExploreScreen(
                        onNavigateToFund = { schemeCode ->
                            navController.navigate(Screen.FundDetail.createRoute(schemeCode))
                        }
                    )
                }

                composable(Screen.Insights.route) {
                    InsightsScreen(
                        onNavigateToRecommendations = {
                            navController.navigate(Screen.Recommendations.route)
                        }
                    )
                }

                composable(Screen.Profile.route) {
                    ProfileScreen(
                        onLogout = {
                            authViewModel.logout()
                            navController.navigate(Screen.Login.route) {
                                popUpTo(Screen.Home.route) { inclusive = true }
                            }
                        },
                        onNavigateToSettings = {
                            navController.navigate(Screen.Settings.route)
                        },
                        onNavigateToGoals = {
                            navController.navigate(Screen.Goals.route)
                        }
                    )
                }

                // Detail screens
                composable(
                    route = Screen.FundDetail.route,
                    arguments = listOf(
                        navArgument(NavArguments.SCHEME_CODE) { type = NavType.IntType }
                    )
                ) { backStackEntry ->
                    val schemeCode = backStackEntry.arguments?.getInt(NavArguments.SCHEME_CODE) ?: 0

                    FundDetailScreen(
                        schemeCode = schemeCode,
                        onBackClick = {
                            navController.popBackStack()
                        }
                    )
                }

                composable(Screen.Goals.route) {
                    GoalsScreen(
                        onNavigateToGoal = { goalId ->
                            navController.navigate(Screen.GoalDetail.createRoute(goalId))
                        },
                        onCreateGoal = {
                            navController.navigate(Screen.CreateGoal.route)
                        },
                        onBackClick = {
                            navController.popBackStack()
                        }
                    )
                }

                composable(
                    route = Screen.GoalDetail.route,
                    arguments = listOf(
                        navArgument(NavArguments.GOAL_ID) { type = NavType.StringType }
                    )
                ) {
                    GoalDetailScreen(
                        onNavigateToFund = { schemeCode ->
                            navController.navigate(Screen.FundDetail.createRoute(schemeCode))
                        },
                        onBackClick = {
                            navController.popBackStack()
                        }
                    )
                }
            }
        }
    }
}
