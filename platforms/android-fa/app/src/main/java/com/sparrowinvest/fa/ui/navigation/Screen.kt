package com.sparrowinvest.fa.ui.navigation

sealed class Screen(val route: String) {
    // Auth screens
    data object Login : Screen("login")

    // Main screens (Bottom Nav)
    data object Dashboard : Screen("dashboard")
    data object Clients : Screen("clients")
    data object Transactions : Screen("transactions")
    data object Insights : Screen("insights")
    data object More : Screen("more")

    // Client screens
    data object ClientDetail : Screen("client/{clientId}") {
        fun createRoute(clientId: String) = "client/$clientId"
    }
    data object AddClient : Screen("client/add")
    data object EditClient : Screen("client/{clientId}/edit") {
        fun createRoute(clientId: String) = "client/$clientId/edit"
    }

    // Transaction screens
    data object NewTransactionWizard : Screen("transaction/new?clientId={clientId}") {
        fun createRoute(clientId: String? = null): String {
            return if (clientId != null) "transaction/new?clientId=$clientId"
            else "transaction/new"
        }
    }
    data object ExecuteTrade : Screen("trade/execute/{clientId}") {
        fun createRoute(clientId: String) = "trade/execute/$clientId"
    }
    data object TransactionDetail : Screen("transaction/{transactionId}") {
        fun createRoute(transactionId: String) = "transaction/$transactionId"
    }
    data object PlatformWebView : Screen("platform/{platformId}") {
        fun createRoute(platformId: String) = "platform/$platformId"
    }

    // SIP screens
    data object SipList : Screen("sips")
    data object CreateSip : Screen("sip/create/{clientId}") {
        fun createRoute(clientId: String) = "sip/create/$clientId"
    }

    // Fund screens
    data object FundSearch : Screen("funds/search")
    data object FundUniverse : Screen("funds/universe")
    data object WhitelistedFunds : Screen("funds/whitelisted")
    data object FundDetail : Screen("fund/{schemeCode}") {
        fun createRoute(schemeCode: Int) = "fund/$schemeCode"
    }

    // Prospects
    data object Prospects : Screen("prospects")

    // Action Center
    data object ActionCenter : Screen("action-center")

    // Tools
    data object Reports : Screen("reports")
    data object Calculators : Screen("calculators")

    // Settings
    data object Settings : Screen("settings")
    data object Notifications : Screen("notifications")
    data object Security : Screen("security")
    data object HelpSupport : Screen("help")

    // Communications
    data object Communications : Screen("communications")

    // AI Chat
    data object AvyaChat : Screen("avya_chat?query={query}") {
        fun createRoute(query: String? = null): String {
            return if (query != null) {
                "avya_chat?query=${java.net.URLEncoder.encode(query, "UTF-8")}"
            } else {
                "avya_chat"
            }
        }
    }
}

object NavArguments {
    const val CLIENT_ID = "clientId"
    const val TRANSACTION_ID = "transactionId"
    const val SCHEME_CODE = "schemeCode"
    const val PLATFORM_ID = "platformId"
    const val QUERY = "query"
}
