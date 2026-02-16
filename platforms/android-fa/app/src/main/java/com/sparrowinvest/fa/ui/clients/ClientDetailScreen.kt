package com.sparrowinvest.fa.ui.clients

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Sort
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.NoteAlt
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Verified
import androidx.compose.material.icons.filled.HealthAndSafety
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.platform.LocalContext
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.ClientDetail
import com.sparrowinvest.fa.data.model.FASip
import com.sparrowinvest.fa.data.model.FATransaction
import com.sparrowinvest.fa.data.model.FamilyMember
import com.sparrowinvest.fa.data.model.Holding
import android.widget.Toast
import com.sparrowinvest.fa.core.util.PdfReportGenerator
import com.sparrowinvest.fa.ui.clients.reports.reportsTabContent
import com.sparrowinvest.fa.ui.clients.insurance.insuranceTabContent
import com.sparrowinvest.fa.ui.clients.insurance.AddInsurancePolicyDialog
import com.sparrowinvest.fa.ui.clients.notesTabContent
import com.sparrowinvest.fa.ui.clients.AddNoteDialog
import com.sparrowinvest.fa.data.model.MeetingNote
import com.sparrowinvest.fa.ui.clients.insurance.RecordPaymentDialog
import com.sparrowinvest.fa.ui.clients.insurance.PaymentHistoryDialog
import com.sparrowinvest.fa.ui.clients.insurance.PolicyDocumentsDialog
import com.sparrowinvest.fa.data.model.InsurancePolicy
import com.sparrowinvest.fa.data.model.PremiumPayment
import com.sparrowinvest.fa.data.model.GapAnalysisResponse
import com.sparrowinvest.fa.data.model.CreateInsurancePolicyRequest
import com.sparrowinvest.fa.data.model.RecordPremiumPaymentRequest
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.IconContainer
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.QuickActionButton
import com.sparrowinvest.fa.ui.components.ReturnBadge
import com.sparrowinvest.fa.ui.components.StatusBadge
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.Info
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.Warning

// Filter & Sort Enums
enum class TransactionTypeFilter(val label: String, val value: String?, val isUpcoming: Boolean = false) {
    UPCOMING("Upcoming", null, true),
    ALL("All", null),
    BUY("Buy", "BUY"),
    SELL("Sell", "SELL"),
    SIP("SIP", "SIP")
}

enum class TransactionStatusFilter(val label: String, val value: String?) {
    ALL("All", null),
    PENDING("Pending", "PENDING"),
    EXECUTED("Executed", "EXECUTED"),
    APPROVED("Approved", "APPROVED"),
    REJECTED("Rejected", "REJECTED")
}

enum class TransactionSort(val label: String) {
    DATE_DESC("Date ↓"),
    DATE_ASC("Date ↑"),
    AMOUNT_DESC("Amount ↓"),
    AMOUNT_ASC("Amount ↑")
}

enum class HoldingSort(val label: String) {
    VALUE_DESC("Value ↓"),
    VALUE_ASC("Value ↑"),
    RETURNS_DESC("Returns ↓"),
    RETURNS_ASC("Returns ↑"),
    INVESTED_DESC("Invested ↓"),
    INVESTED_ASC("Invested ↑")
}

enum class HoldingCategoryFilter(val label: String, val matchPattern: String?) {
    ALL("All", null),
    EQUITY("Equity", "Equity"),
    DEBT("Debt", "Debt"),
    HYBRID("Hybrid", "Hybrid")
}

// Pending Action Types
data class PendingAction(
    val id: String,
    val type: PendingActionType,
    val title: String,
    val description: String,
    val dueDate: String? = null,
    val priority: ActionPriority = ActionPriority.MEDIUM
)

enum class PendingActionType {
    KYC_RENEWAL,
    MANDATE_SETUP,
    DOCUMENT_UPLOAD,
    RISK_PROFILE_UPDATE,
    NOMINATION_UPDATE,
    BANK_VERIFICATION
}

enum class ActionPriority {
    HIGH, MEDIUM, LOW
}

enum class ClientTab(val title: String, val icon: ImageVector) {
    OVERVIEW("Overview", Icons.Default.Person),
    FAMILY("Family", Icons.Default.Groups),
    HOLDINGS("Holdings", Icons.Default.PieChart),
    TRANSACTIONS("Transactions", Icons.Default.History),
    SIPS("SIPs", Icons.Default.Repeat),
    GOALS("Goals", Icons.Default.Flag),
    NOTES("Notes", Icons.Default.NoteAlt),
    REPORTS("Reports", Icons.Default.Description),
    INSURANCE("Insurance", Icons.Filled.HealthAndSafety)
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun ClientDetailScreen(
    clientId: String,
    viewModel: ClientDetailViewModel = hiltViewModel(),
    onBackClick: () -> Unit,
    onNavigateToFund: (Int) -> Unit,
    onNavigateToExecuteTrade: () -> Unit,
    onNavigateToCreateSip: () -> Unit,
    onNavigateToClient: (String) -> Unit = {}, // Navigate to family member's profile
    onNavigateToEditClient: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val allocationData by viewModel.allocationState.collectAsState()
    val historyData by viewModel.historyState.collectAsState()
    val selectedPeriod by viewModel.selectedPeriod.collectAsState()
    var selectedTab by remember { mutableStateOf(ClientTab.OVERVIEW) }
    val isRefreshing = uiState is ClientDetailUiState.Loading

    LaunchedEffect(clientId) {
        viewModel.loadClient(clientId)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        TopBar(
            title = "Client Details",
            onBackClick = onBackClick,
            actions = {
                IconButton(onClick = onNavigateToEditClient) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "Edit Client",
                        tint = Primary
                    )
                }
            }
        )

        androidx.compose.material3.pulltorefresh.PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { viewModel.refresh() },
            modifier = Modifier.fillMaxSize()
        ) {
            when (val state = uiState) {
                is ClientDetailUiState.Loading -> {
                    LoadingIndicator(
                        modifier = Modifier.fillMaxSize(),
                        message = "Loading client..."
                    )
                }
                is ClientDetailUiState.Error -> {
                    ErrorState(
                        message = state.message,
                        onRetry = { viewModel.loadClient(clientId) },
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is ClientDetailUiState.Success -> {
                    ClientDetailContent(
                        client = state.client,
                        selectedTab = selectedTab,
                        onTabSelected = { selectedTab = it },
                        onNavigateToFund = onNavigateToFund,
                        onExecuteTrade = onNavigateToExecuteTrade,
                        onCreateSip = onNavigateToCreateSip,
                        onNavigateToClient = onNavigateToClient,
                        allocationData = allocationData,
                        historyData = historyData,
                        selectedPeriod = selectedPeriod,
                        onPeriodChange = viewModel::onPeriodChange
                    )
                }
            }
        }
    }
}

@Composable
private fun ClientDetailContent(
    client: ClientDetail,
    selectedTab: ClientTab,
    onTabSelected: (ClientTab) -> Unit,
    onNavigateToFund: (Int) -> Unit,
    onExecuteTrade: () -> Unit,
    onCreateSip: () -> Unit,
    onNavigateToClient: (String) -> Unit,
    allocationData: List<com.sparrowinvest.fa.data.model.AssetAllocationItem> = emptyList(),
    historyData: List<com.sparrowinvest.fa.data.model.PortfolioHistoryPoint> = emptyList(),
    selectedPeriod: String = "1Y",
    onPeriodChange: (String) -> Unit = {}
) {
    val context = LocalContext.current
    var showShareSheet by remember { mutableStateOf(false) }

    // Notes state
    var meetingNotes by remember { mutableStateOf<List<MeetingNote>>(emptyList()) }
    var showAddNote by remember { mutableStateOf(false) }

    // Insurance state
    var insurancePolicies by remember { mutableStateOf<List<InsurancePolicy>>(emptyList()) }
    var gapAnalysis by remember { mutableStateOf<GapAnalysisResponse?>(null) }
    var showAddInsurance by remember { mutableStateOf(false) }
    var selectedPolicyForPayment by remember { mutableStateOf<InsurancePolicy?>(null) }
    var selectedPolicyForHistory by remember { mutableStateOf<InsurancePolicy?>(null) }
    var paymentHistory by remember { mutableStateOf<List<PremiumPayment>>(emptyList()) }
    var isSavingPayment by remember { mutableStateOf(false) }
    var selectedPolicyForDocuments by remember { mutableStateOf<InsurancePolicy?>(null) }
    var policyDocuments by remember { mutableStateOf<List<com.sparrowinvest.fa.data.model.PolicyDocument>>(emptyList()) }
    var isUploadingDocument by remember { mutableStateOf(false) }

    // Generate pending actions based on client data
    val pendingActions = remember(client) {
        buildList {
            // KYC check
            if (client.kycStatus != "VERIFIED" && client.kycStatus != "APPROVED") {
                add(PendingAction(
                    id = "kyc_${client.id}",
                    type = PendingActionType.KYC_RENEWAL,
                    title = "Complete KYC",
                    description = "KYC verification is ${client.kycStatus?.lowercase() ?: "pending"}",
                    priority = ActionPriority.HIGH
                ))
            }
            // Risk profile check
            if (client.riskProfile == null) {
                add(PendingAction(
                    id = "risk_${client.id}",
                    type = PendingActionType.RISK_PROFILE_UPDATE,
                    title = "Update Risk Profile",
                    description = "Risk assessment not completed",
                    priority = ActionPriority.MEDIUM
                ))
            }
            // Mandate setup for SIP clients
            if (client.sips.isNotEmpty()) {
                add(PendingAction(
                    id = "mandate_${client.id}",
                    type = PendingActionType.MANDATE_SETUP,
                    title = "Setup eMandate",
                    description = "Enable auto-debit for SIP payments",
                    priority = ActionPriority.MEDIUM
                ))
            }
            // Nomination update
            add(PendingAction(
                id = "nomination_${client.id}",
                type = PendingActionType.NOMINATION_UPDATE,
                title = "Add Nominee",
                description = "Nomination details not updated",
                priority = ActionPriority.LOW
            ))
        }
    }

    // Transaction filters/sort state
    var transactionTypeFilter by remember { mutableStateOf(TransactionTypeFilter.ALL) }
    var transactionStatusFilter by remember { mutableStateOf(TransactionStatusFilter.ALL) }
    var transactionSort by remember { mutableStateOf(TransactionSort.DATE_DESC) }

    // Holdings filters/sort state
    var holdingCategoryFilter by remember { mutableStateOf(HoldingCategoryFilter.ALL) }
    var holdingSort by remember { mutableStateOf(HoldingSort.VALUE_DESC) }

    // Filtered & sorted transactions
    val filteredTransactions = remember(client.recentTransactions, transactionTypeFilter, transactionStatusFilter, transactionSort) {
        client.recentTransactions
            .filter { tx ->
                when {
                    // Upcoming filter: show only pending transactions
                    transactionTypeFilter.isUpcoming -> tx.status == "PENDING"
                    // Other type filters
                    else -> (transactionTypeFilter.value == null || tx.type.uppercase() == transactionTypeFilter.value) &&
                            (transactionStatusFilter.value == null || tx.status == transactionStatusFilter.value)
                }
            }
            .let { list ->
                when (transactionSort) {
                    TransactionSort.DATE_DESC -> list.sortedByDescending { it.date }
                    TransactionSort.DATE_ASC -> list.sortedBy { it.date }
                    TransactionSort.AMOUNT_DESC -> list.sortedByDescending { it.amount }
                    TransactionSort.AMOUNT_ASC -> list.sortedBy { it.amount }
                }
            }
    }

    // Filtered & sorted holdings
    val filteredHoldings = remember(client.holdings, holdingCategoryFilter, holdingSort) {
        val pattern = holdingCategoryFilter.matchPattern
        client.holdings
            .filter { holding ->
                pattern == null ||
                holding.category?.contains(pattern, ignoreCase = true) == true
            }
            .let { list ->
                when (holdingSort) {
                    HoldingSort.VALUE_DESC -> list.sortedByDescending { it.currentValue }
                    HoldingSort.VALUE_ASC -> list.sortedBy { it.currentValue }
                    HoldingSort.RETURNS_DESC -> list.sortedByDescending { it.returnsPercentage }
                    HoldingSort.RETURNS_ASC -> list.sortedBy { it.returnsPercentage }
                    HoldingSort.INVESTED_DESC -> list.sortedByDescending { it.investedValue }
                    HoldingSort.INVESTED_ASC -> list.sortedBy { it.investedValue }
                }
            }
    }

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Redesigned Header Section
        Column(
            modifier = Modifier.padding(horizontal = Spacing.medium)
        ) {
            Spacer(modifier = Modifier.height(Spacing.small))

            // Compact Client Header with Actions
            ClientHeaderCardV2(
                client = client,
                onBuyClick = onExecuteTrade,
                onSipClick = onCreateSip,
                onShareClick = { showShareSheet = true },
                onCallClick = {
                    client.phone?.let { phone ->
                        val intent = Intent(Intent.ACTION_DIAL).apply {
                            data = Uri.parse("tel:${phone.replace(" ", "")}")
                        }
                        context.startActivity(intent)
                    }
                },
                onGeneratePdf = {
                    val file = PdfReportGenerator.generateClientReport(context, client)
                    if (file != null) {
                        PdfReportGenerator.shareReport(context, file)
                    } else {
                        Toast.makeText(context, "Failed to generate report", Toast.LENGTH_SHORT).show()
                    }
                }
            )

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Pending Actions Banner (collapsed style)
            if (pendingActions.isNotEmpty()) {
                PendingActionsBanner(
                    actions = pendingActions,
                    onActionClick = { /* Handle */ }
                )
                Spacer(modifier = Modifier.height(Spacing.compact))
            }

            // Tab Bar
            ClientTabBar(
                selectedTab = selectedTab,
                onTabSelected = onTabSelected,
                holdingsCount = client.holdings.size,
                transactionsCount = client.recentTransactions.size,
                sipsCount = client.sips.size,
                familyCount = client.familyMembers.size
            )
        }

        Spacer(modifier = Modifier.height(Spacing.compact))

        // Tab Content
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = Spacing.medium),
            verticalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            when (selectedTab) {
                ClientTab.OVERVIEW -> {
                    item { OverviewSection(
                        client = client,
                        pendingActions = pendingActions,
                        allocationData = allocationData,
                        historyData = historyData,
                        selectedPeriod = selectedPeriod,
                        onPeriodChange = onPeriodChange
                    ) }
                }
                ClientTab.HOLDINGS -> {
                    if (client.holdings.isEmpty()) {
                        item { EmptyStateCard(message = "No holdings yet", icon = Icons.Default.PieChart) }
                    } else {
                        // Holdings Filter/Sort Bar
                        item {
                            HoldingsFilterBar(
                                categoryFilter = holdingCategoryFilter,
                                onCategoryFilterChange = { holdingCategoryFilter = it },
                                sort = holdingSort,
                                onSortChange = { holdingSort = it }
                            )
                        }
                        item {
                            HoldingsSummaryCard(holdings = filteredHoldings)
                        }
                        if (filteredHoldings.isEmpty()) {
                            item {
                                Text(
                                    text = "No holdings match the filter",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(vertical = Spacing.medium)
                                )
                            }
                        } else {
                            items(filteredHoldings) { holding ->
                                HoldingItem(
                                    holding = holding,
                                    onClick = { holding.schemeCode?.let { onNavigateToFund(it) } }
                                )
                            }
                        }
                    }
                }
                ClientTab.TRANSACTIONS -> {
                    if (client.recentTransactions.isEmpty() && client.sips.isEmpty()) {
                        item { EmptyStateCard(message = "No transactions yet", icon = Icons.Default.History) }
                    } else {
                        // Transactions Filter/Sort Bar
                        item {
                            TransactionsFilterBar(
                                typeFilter = transactionTypeFilter,
                                onTypeFilterChange = { transactionTypeFilter = it },
                                statusFilter = transactionStatusFilter,
                                onStatusFilterChange = { transactionStatusFilter = it },
                                sort = transactionSort,
                                onSortChange = { transactionSort = it }
                            )
                        }

                        // When Upcoming filter is selected, show upcoming SIPs section
                        if (transactionTypeFilter.isUpcoming) {
                            val upcomingSips = client.sips.filter { it.isActive }
                            if (upcomingSips.isNotEmpty()) {
                                item {
                                    UpcomingSipsCard(upcomingSips = upcomingSips)
                                }
                            }
                        }

                        // Transactions list
                        if (filteredTransactions.isEmpty()) {
                            item {
                                Text(
                                    text = if (transactionTypeFilter.isUpcoming)
                                        "No pending transactions"
                                    else
                                        "No transactions match the filters",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(vertical = Spacing.medium)
                                )
                            }
                        } else {
                            // Section header for pending transactions in Upcoming view
                            if (transactionTypeFilter.isUpcoming) {
                                item {
                                    Text(
                                        text = "PENDING REQUESTS (${filteredTransactions.size})",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(top = Spacing.small)
                                    )
                                }
                            }
                            items(filteredTransactions) { transaction ->
                                TransactionItem(transaction = transaction)
                            }
                        }
                    }
                }
                ClientTab.SIPS -> {
                    if (client.sips.isEmpty()) {
                        item { EmptyStateCard(message = "No active SIPs", icon = Icons.Default.Repeat) }
                    } else {
                        item {
                            SipSummaryCard(sips = client.sips)
                        }
                        items(client.sips) { sip ->
                            SipItem(sip = sip)
                        }
                    }
                }
                ClientTab.GOALS -> {
                    item { GoalsSection(client = client) }
                }
                ClientTab.FAMILY -> {
                    // Filter to only show members with folio
                    val membersWithFolio = client.familyMembers.filter { it.hasFolio && it.aum > 0 }

                    if (membersWithFolio.isEmpty()) {
                        item { EmptyStateCard(message = "No family members with folio", icon = Icons.Default.Groups) }
                    } else {
                        // Family Summary Card
                        item {
                            FamilyHoldingsSummary(
                                members = membersWithFolio,
                                currentClientName = client.name
                            )
                        }

                        // Family Members List
                        items(membersWithFolio) { member ->
                            FamilyMemberCardV2(
                                member = member,
                                isCurrentClient = member.relationship.uppercase() == "SELF",
                                onClick = {
                                    member.clientId?.let { onNavigateToClient(it) }
                                }
                            )
                        }
                    }
                }
                ClientTab.NOTES -> {
                    notesTabContent(
                        notes = meetingNotes,
                        onAddClick = { showAddNote = true },
                        onDeleteClick = { noteId ->
                            meetingNotes = meetingNotes.filter { it.id != noteId }
                        }
                    )
                }
                ClientTab.REPORTS -> {
                    reportsTabContent(client = client)
                }
                ClientTab.INSURANCE -> {
                    insuranceTabContent(
                        policies = insurancePolicies,
                        gapAnalysis = gapAnalysis,
                        onAddClick = { showAddInsurance = true },
                        onDeleteClick = { policyId ->
                            insurancePolicies = insurancePolicies.filter { it.id != policyId }
                        },
                        onRecordPayment = { policy ->
                            selectedPolicyForPayment = policy
                        },
                        onViewHistory = { policy ->
                            paymentHistory = emptyList()
                            selectedPolicyForHistory = policy
                        },
                        onViewDocuments = { policy ->
                            policyDocuments = emptyList()
                            selectedPolicyForDocuments = policy
                        }
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(Spacing.large))
            }
        }
    }

    // Share with Client bottom sheet
    if (showShareSheet) {
        ShareWithClientSheet(
            clientId = client.id,
            clientName = client.name,
            onDismiss = { showShareSheet = false }
        )
    }

    // Add Meeting Note dialog
    if (showAddNote) {
        AddNoteDialog(
            onDismiss = { showAddNote = false },
            onSave = { request ->
                val newNote = MeetingNote(
                    id = java.util.UUID.randomUUID().toString(),
                    clientId = client.id,
                    title = request.title,
                    content = request.content,
                    meetingType = request.meetingType,
                    meetingDate = request.meetingDate,
                    createdAt = java.time.LocalDate.now().toString()
                )
                meetingNotes = listOf(newNote) + meetingNotes
                showAddNote = false
            }
        )
    }

    // Add Insurance Policy dialog
    if (showAddInsurance) {
        AddInsurancePolicyDialog(
            onDismiss = { showAddInsurance = false },
            onSave = { request ->
                // Optimistically add to local list
                val newPolicy = InsurancePolicy(
                    id = java.util.UUID.randomUUID().toString(),
                    clientId = client.id,
                    policyNumber = request.policyNumber,
                    provider = request.provider,
                    type = request.type,
                    status = "ACTIVE",
                    sumAssured = request.sumAssured,
                    premiumAmount = request.premiumAmount,
                    premiumFrequency = request.premiumFrequency ?: "ANNUAL",
                    startDate = request.startDate,
                    maturityDate = request.maturityDate,
                    nominees = request.nominees,
                    notes = request.notes
                )
                insurancePolicies = listOf(newPolicy) + insurancePolicies
                showAddInsurance = false
            }
        )
    }

    // Record Payment dialog
    selectedPolicyForPayment?.let { policy ->
        RecordPaymentDialog(
            policy = policy,
            isSaving = isSavingPayment,
            onDismiss = { selectedPolicyForPayment = null },
            onSave = { request ->
                isSavingPayment = true
                // Optimistic: dismiss and reset
                selectedPolicyForPayment = null
                isSavingPayment = false
            }
        )
    }

    // Payment History dialog
    selectedPolicyForHistory?.let { policy ->
        PaymentHistoryDialog(
            payments = paymentHistory,
            onDismiss = { selectedPolicyForHistory = null }
        )
    }

    // Documents dialog
    selectedPolicyForDocuments?.let { policy ->
        PolicyDocumentsDialog(
            documents = policyDocuments,
            isUploading = isUploadingDocument,
            onDismiss = { selectedPolicyForDocuments = null },
            onUpload = { bytes, fileName, mimeType ->
                isUploadingDocument = true
                // Optimistic: add mock document
                val mockDoc = com.sparrowinvest.fa.data.model.PolicyDocument(
                    id = java.util.UUID.randomUUID().toString(),
                    policyId = policy.id,
                    fileName = fileName,
                    mimeType = mimeType,
                    fileSize = bytes.size,
                    uploadedAt = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(java.util.Date())
                )
                policyDocuments = listOf(mockDoc) + policyDocuments
                isUploadingDocument = false
            },
            onDownload = { docId ->
                // Open in browser — in real app, fetch signed URL first
            },
            onDelete = { docId ->
                policyDocuments = policyDocuments.filter { it.id != docId }
            }
        )
    }
}

@Composable
private fun ClientHeaderCardV2(
    client: ClientDetail,
    onBuyClick: () -> Unit,
    onSipClick: () -> Unit,
    onShareClick: () -> Unit,
    onCallClick: () -> Unit = {},
    onGeneratePdf: () -> Unit = {}
) {
    GlassCard(
        contentPadding = Spacing.medium
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            // Row 1: Avatar, Name, Share Icons
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = client.name.split(" ").mapNotNull { it.firstOrNull()?.uppercase() }.take(2).joinToString(""),
                        style = MaterialTheme.typography.titleMedium,
                        color = Primary
                    )
                }

                Spacer(modifier = Modifier.width(Spacing.compact))

                // Name & Inline Stats
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = client.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                    ) {
                        Text(
                            text = "₹${formatAmount(client.aum)}",
                            style = MaterialTheme.typography.labelLarge,
                            color = Primary
                        )
                        ReturnBadge(returnValue = client.returns)
                        Text(
                            text = "${client.holdings.size} funds",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Call button
                if (client.phone != null) {
                    MiniIconButton(
                        icon = Icons.Default.Call,
                        color = Success,
                        onClick = onCallClick
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                }

                // Share Button with dropdown
                var showShareDropdown by remember { mutableStateOf(false) }
                Box {
                    MiniIconButton(
                        icon = Icons.Default.Share,
                        color = Primary,
                        onClick = { showShareDropdown = true }
                    )
                    DropdownMenu(
                        expanded = showShareDropdown,
                        onDismissRequest = { showShareDropdown = false }
                    ) {
                        DropdownMenuItem(
                            text = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Share,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp),
                                        tint = Primary
                                    )
                                    Column {
                                        Text("Share with Client", style = MaterialTheme.typography.bodyMedium)
                                        Text("Send via email or WhatsApp", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            },
                            onClick = {
                                showShareDropdown = false
                                onShareClick()
                            }
                        )
                        DropdownMenuItem(
                            text = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.Description,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp),
                                        tint = Info
                                    )
                                    Column {
                                        Text("Generate PDF", style = MaterialTheme.typography.bodyMedium)
                                        Text("Create downloadable report", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            },
                            onClick = {
                                showShareDropdown = false
                                onGeneratePdf()
                            }
                        )
                    }
                }
            }

            // Row 2: Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                CompactActionButton(
                    text = "Buy",
                    icon = Icons.Default.ShoppingCart,
                    color = Primary,
                    modifier = Modifier.weight(1f),
                    onClick = onBuyClick
                )
                CompactActionButton(
                    text = "Start SIP",
                    icon = Icons.Default.Repeat,
                    color = Success,
                    modifier = Modifier.weight(1f),
                    onClick = onSipClick
                )
            }
        }
    }
}

@Composable
private fun MiniIconButton(
    icon: ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .clip(CircleShape)
            .background(color.copy(alpha = 0.1f))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = color
        )
    }
}

@Composable
private fun CompactStat(
    label: String,
    value: String,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleSmall,
            color = color
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun CompactStatDivider() {
    Box(
        modifier = Modifier
            .width(1.dp)
            .height(24.dp)
            .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    )
}

@Composable
private fun StatTile(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    val isDark = com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme.current

    val shape = RoundedCornerShape(CornerRadius.medium)

    Box(
        modifier = modifier
            .clip(shape)
            .background(color.copy(alpha = if (isDark) 0.12f else 0.08f))
            .then(
                if (isDark) Modifier.border(
                    width = 1.dp,
                    color = color.copy(alpha = 0.2f),
                    shape = shape
                ) else Modifier
            )
            .padding(Spacing.compact)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                color = color
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun CompactActionButton(
    text: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val isDark = com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme.current
    val bgColor = if (isDark) color.copy(alpha = 0.15f) else color
    val contentColor = if (isDark) color else Color.White

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(bgColor)
            .then(
                if (isDark) Modifier.then(
                    Modifier.clip(RoundedCornerShape(CornerRadius.medium))
                ) else Modifier
            )
            .clickable(onClick = onClick)
            .padding(vertical = Spacing.small)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = contentColor
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                color = contentColor
            )
        }
    }
}

@Composable
private fun ClientTabBar(
    selectedTab: ClientTab,
    onTabSelected: (ClientTab) -> Unit,
    holdingsCount: Int,
    transactionsCount: Int,
    sipsCount: Int,
    familyCount: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        ClientTab.entries.forEach { tab ->
            val count = when (tab) {
                ClientTab.HOLDINGS -> holdingsCount
                ClientTab.TRANSACTIONS -> transactionsCount
                ClientTab.SIPS -> sipsCount
                ClientTab.FAMILY -> familyCount
                else -> null
            }
            TabChip(
                tab = tab,
                isSelected = selectedTab == tab,
                count = count,
                onClick = { onTabSelected(tab) }
            )
        }
    }
}

@Composable
private fun TabChip(
    tab: ClientTab,
    isSelected: Boolean,
    count: Int?,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(CornerRadius.large))
            .background(
                if (isSelected) Primary
                else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.compact, vertical = Spacing.small)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = tab.icon,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = tab.title,
                style = MaterialTheme.typography.labelMedium,
                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
            )
            count?.let {
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(
                            if (isSelected) Color.White.copy(alpha = 0.2f)
                            else Primary.copy(alpha = 0.2f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "$it",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSelected) Color.White else Primary
                    )
                }
            }
        }
    }
}

// ==================== FILTER BAR COMPOSABLES ====================

@Composable
private fun TransactionsFilterBar(
    typeFilter: TransactionTypeFilter,
    onTypeFilterChange: (TransactionTypeFilter) -> Unit,
    statusFilter: TransactionStatusFilter,
    onStatusFilterChange: (TransactionStatusFilter) -> Unit,
    sort: TransactionSort,
    onSortChange: (TransactionSort) -> Unit
) {
    var showStatusMenu by remember { mutableStateOf(false) }
    var showSortMenu by remember { mutableStateOf(false) }

    Column(
        verticalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        // Type Filter Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            TransactionTypeFilter.entries.forEach { filter ->
                FilterChip(
                    label = filter.label,
                    isSelected = typeFilter == filter,
                    onClick = { onTypeFilterChange(filter) },
                    color = when (filter) {
                        TransactionTypeFilter.UPCOMING -> Warning
                        TransactionTypeFilter.BUY -> Success
                        TransactionTypeFilter.SELL -> Error
                        TransactionTypeFilter.SIP -> Primary
                        TransactionTypeFilter.ALL -> MaterialTheme.colorScheme.primary
                    }
                )
            }
        }

        // Status Filter & Sort Row (hide status when Upcoming is selected)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            // Status Dropdown - only show when not in Upcoming mode
            if (!typeFilter.isUpcoming) {
                Box {
                    FilterDropdownButton(
                        icon = Icons.Default.FilterList,
                        label = "Status: ${statusFilter.label}",
                        onClick = { showStatusMenu = true }
                    )
                    DropdownMenu(
                        expanded = showStatusMenu,
                        onDismissRequest = { showStatusMenu = false }
                    ) {
                        TransactionStatusFilter.entries.forEach { filter ->
                            DropdownMenuItem(
                                text = {
                                    Text(
                                        text = filter.label,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (statusFilter == filter) Primary else MaterialTheme.colorScheme.onSurface
                                    )
                                },
                                onClick = {
                                    onStatusFilterChange(filter)
                                    showStatusMenu = false
                                }
                            )
                        }
                    }
                }
            }

            // Sort Dropdown
            Box {
                FilterDropdownButton(
                    icon = Icons.AutoMirrored.Filled.Sort,
                    label = sort.label,
                    onClick = { showSortMenu = true }
                )
                DropdownMenu(
                    expanded = showSortMenu,
                    onDismissRequest = { showSortMenu = false }
                ) {
                    TransactionSort.entries.forEach { sortOption ->
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = sortOption.label,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = if (sort == sortOption) Primary else MaterialTheme.colorScheme.onSurface
                                )
                            },
                            onClick = {
                                onSortChange(sortOption)
                                showSortMenu = false
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HoldingsFilterBar(
    categoryFilter: HoldingCategoryFilter,
    onCategoryFilterChange: (HoldingCategoryFilter) -> Unit,
    sort: HoldingSort,
    onSortChange: (HoldingSort) -> Unit
) {
    var showSortMenu by remember { mutableStateOf(false) }

    Column(
        verticalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        // Category Filter Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            HoldingCategoryFilter.entries.forEach { filter ->
                FilterChip(
                    label = filter.label,
                    isSelected = categoryFilter == filter,
                    onClick = { onCategoryFilterChange(filter) },
                    color = when (filter) {
                        HoldingCategoryFilter.EQUITY -> Success
                        HoldingCategoryFilter.DEBT -> Info
                        HoldingCategoryFilter.HYBRID -> Warning
                        HoldingCategoryFilter.ALL -> MaterialTheme.colorScheme.primary
                    }
                )
            }
        }

        // Sort Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            Box {
                FilterDropdownButton(
                    icon = Icons.AutoMirrored.Filled.Sort,
                    label = "Sort: ${sort.label}",
                    onClick = { showSortMenu = true }
                )
                DropdownMenu(
                    expanded = showSortMenu,
                    onDismissRequest = { showSortMenu = false }
                ) {
                    HoldingSort.entries.forEach { sortOption ->
                        DropdownMenuItem(
                            text = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = sortOption.label,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (sort == sortOption) Primary else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            },
                            onClick = {
                                onSortChange(sortOption)
                                showSortMenu = false
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FilterChip(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    color: Color = Primary
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(CornerRadius.large))
            .background(
                if (isSelected) color
                else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.compact, vertical = Spacing.small)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun FilterDropdownButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.compact, vertical = Spacing.small)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// ==================== END FILTER BAR COMPOSABLES ====================

// ==================== SHARE COMPONENTS ====================

@Composable
private fun ShareButton(
    text: String,
    icon: ImageVector,
    backgroundColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(backgroundColor.copy(alpha = 0.15f))
            .clickable(onClick = onClick)
            .padding(vertical = Spacing.small)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = backgroundColor
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                color = backgroundColor
            )
        }
    }
}

// ==================== END SHARE COMPONENTS ====================

// ==================== PENDING ACTIONS BANNER ====================

@Composable
private fun PendingActionsBanner(
    actions: List<PendingAction>,
    onActionClick: (PendingAction) -> Unit
) {
    var isExpanded by remember { mutableStateOf(false) }
    val highPriorityCount = actions.count { it.priority == ActionPriority.HIGH }

    Column {
        // Collapsed banner
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(
                    if (highPriorityCount > 0) Error.copy(alpha = 0.1f)
                    else Warning.copy(alpha = 0.1f)
                )
                .clickable { isExpanded = !isExpanded }
                .padding(horizontal = Spacing.compact, vertical = Spacing.small),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = if (highPriorityCount > 0) Error else Warning
                )
                Text(
                    text = "${actions.size} pending action${if (actions.size > 1) "s" else ""}",
                    style = MaterialTheme.typography.labelMedium,
                    color = if (highPriorityCount > 0) Error else Warning
                )
                if (highPriorityCount > 0) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Error)
                            .padding(horizontal = 4.dp, vertical = 1.dp)
                    ) {
                        Text(
                            text = "$highPriorityCount urgent",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White
                        )
                    }
                }
            }
            Icon(
                imageVector = if (isExpanded) Icons.Default.ArrowUpward else Icons.Default.ArrowDownward,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Expanded content
        if (isExpanded) {
            Spacer(modifier = Modifier.height(Spacing.small))
            Column(
                verticalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                actions.forEach { action ->
                    CompactPendingActionItem(
                        action = action,
                        onClick = { onActionClick(action) }
                    )
                }
            }
        }
    }
}

@Composable
private fun CompactPendingActionItem(
    action: PendingAction,
    onClick: () -> Unit
) {
    val (icon, color) = when (action.type) {
        PendingActionType.KYC_RENEWAL -> Icons.Outlined.Verified to Error
        PendingActionType.MANDATE_SETUP -> Icons.Default.AccountBalance to Primary
        PendingActionType.DOCUMENT_UPLOAD -> Icons.Outlined.Description to Info
        PendingActionType.RISK_PROFILE_UPDATE -> Icons.Default.Assessment to Warning
        PendingActionType.NOMINATION_UPDATE -> Icons.Default.Groups to Success
        PendingActionType.BANK_VERIFICATION -> Icons.Default.AccountBalance to Primary
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(color.copy(alpha = 0.06f))
            .clickable(onClick = onClick)
            .padding(Spacing.small),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = color
            )
            Text(
                text = action.title,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
        if (action.priority == ActionPriority.HIGH) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(Error.copy(alpha = 0.15f))
                    .padding(horizontal = 4.dp, vertical = 1.dp)
            ) {
                Text(
                    text = "URGENT",
                    style = MaterialTheme.typography.labelSmall,
                    color = Error
                )
            }
        }
    }
}

// ==================== END PENDING ACTIONS BANNER ====================

// ==================== UPCOMING TRANSACTIONS CARD ====================

@Composable
private fun UpcomingTransactionsCard(
    pendingTransactions: List<FATransaction>,
    upcomingSips: List<FASip>
) {
    GlassCard {
        Column(
            verticalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    IconContainer(
                        size = 32.dp,
                        backgroundColor = Warning.copy(alpha = 0.15f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Schedule,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = Warning
                        )
                    }
                    Text(
                        text = "Upcoming",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                // Total count badge
                val totalCount = pendingTransactions.size + upcomingSips.size
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(Warning.copy(alpha = 0.15f))
                        .padding(horizontal = Spacing.small, vertical = 2.dp)
                ) {
                    Text(
                        text = "$totalCount",
                        style = MaterialTheme.typography.labelSmall,
                        color = Warning
                    )
                }
            }

            // Pending Transactions
            if (pendingTransactions.isNotEmpty()) {
                Text(
                    text = "PENDING REQUESTS",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = Spacing.small)
                )
                pendingTransactions.forEach { transaction ->
                    UpcomingTransactionItem(transaction = transaction)
                }
            }

            // Upcoming SIPs
            if (upcomingSips.isNotEmpty()) {
                Text(
                    text = "UPCOMING SIPs",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = Spacing.small)
                )
                upcomingSips.take(3).forEach { sip ->
                    UpcomingSipItem(sip = sip)
                }
                if (upcomingSips.size > 3) {
                    Text(
                        text = "+${upcomingSips.size - 3} more SIPs",
                        style = MaterialTheme.typography.labelSmall,
                        color = Primary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun UpcomingTransactionItem(transaction: FATransaction) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(Warning.copy(alpha = 0.08f))
            .padding(Spacing.compact),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            Icon(
                imageVector = when (transaction.type.uppercase()) {
                    "BUY", "PURCHASE" -> Icons.Default.ShoppingCart
                    "SELL", "REDEMPTION" -> Icons.AutoMirrored.Filled.TrendingUp
                    else -> Icons.Default.Repeat
                },
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = Warning
            )
            Spacer(modifier = Modifier.width(Spacing.small))
            Column {
                Text(
                    text = transaction.fundName,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${transaction.type} • Awaiting approval",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        Text(
            text = transaction.formattedAmount,
            style = MaterialTheme.typography.labelMedium,
            color = Warning
        )
    }
}

@Composable
private fun UpcomingSipItem(sip: FASip) {
    val currentDay = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_MONTH)
    val daysUntilSip = if (sip.sipDate >= currentDay) {
        sip.sipDate - currentDay
    } else {
        // Next month
        val daysInMonth = java.util.Calendar.getInstance().getActualMaximum(java.util.Calendar.DAY_OF_MONTH)
        (daysInMonth - currentDay) + sip.sipDate
    }

    val daysText = when (daysUntilSip) {
        0 -> "Today"
        1 -> "Tomorrow"
        else -> "in $daysUntilSip days"
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(Success.copy(alpha = 0.08f))
            .padding(Spacing.compact),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            // Date indicator
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(Success.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "${sip.sipDate}",
                    style = MaterialTheme.typography.labelMedium,
                    color = Success
                )
            }
            Spacer(modifier = Modifier.width(Spacing.small))
            Column {
                Text(
                    text = sip.fundName,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = daysText,
                    style = MaterialTheme.typography.labelSmall,
                    color = Success
                )
            }
        }
        Text(
            text = sip.formattedAmount,
            style = MaterialTheme.typography.labelMedium,
            color = Success
        )
    }
}

@Composable
private fun UpcomingSipsCard(upcomingSips: List<FASip>) {
    val totalUpcoming = upcomingSips.sumOf { it.amount }
    val nextSipDate = upcomingSips.minOfOrNull { it.sipDate } ?: 0

    GlassCard {
        Column(
            verticalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    IconContainer(
                        size = 32.dp,
                        backgroundColor = Warning.copy(alpha = 0.15f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Schedule,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = Warning
                        )
                    }
                    Column {
                        Text(
                            text = "Upcoming SIPs",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Scheduled this month",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Summary Tiles
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                StatTile(
                    label = "SIPs Due",
                    value = "${upcomingSips.size}",
                    color = Warning,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    label = "Total Amount",
                    value = "₹${formatAmount(totalUpcoming)}",
                    color = Primary,
                    modifier = Modifier.weight(1f)
                )
            }

            // SIP items
            upcomingSips.forEach { sip ->
                UpcomingSipItem(sip = sip)
            }
        }
    }
}

// ==================== END UPCOMING TRANSACTIONS CARD ====================

@Composable
private fun OverviewSection(
    client: ClientDetail,
    pendingActions: List<PendingAction>,
    allocationData: List<com.sparrowinvest.fa.data.model.AssetAllocationItem> = emptyList(),
    historyData: List<com.sparrowinvest.fa.data.model.PortfolioHistoryPoint> = emptyList(),
    selectedPeriod: String = "1Y",
    onPeriodChange: (String) -> Unit = {}
) {
    val totalInvested = client.holdings.sumOf { it.investedValue }
    val totalCurrentValue = client.holdings.sumOf { it.currentValue }
    val monthlySip = client.sips.filter { it.isActive }.sumOf { it.amount }

    Column(
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        // Portfolio Quick Stats
        GlassCard {
            Column(
                verticalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                // Header
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    IconContainer(
                        size = 32.dp,
                        backgroundColor = Primary.copy(alpha = 0.15f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Assessment,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = Primary
                        )
                    }
                    Column {
                        Text(
                            text = "Portfolio Overview",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Quick snapshot",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Stats in 2x2 Tiles
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    StatTile(
                        label = "Total Invested",
                        value = "₹${formatAmount(totalInvested)}",
                        color = Info,
                        modifier = Modifier.weight(1f)
                    )
                    StatTile(
                        label = "Current Value",
                        value = "₹${formatAmount(totalCurrentValue)}",
                        color = Primary,
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    StatTile(
                        label = "Monthly SIP",
                        value = "₹${formatAmount(monthlySip)}",
                        color = Success,
                        modifier = Modifier.weight(1f)
                    )
                    StatTile(
                        label = "Risk Profile",
                        value = client.riskProfile ?: "Not Set",
                        color = if (client.riskProfile != null) Primary else Warning,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Portfolio Value Chart
        if (historyData.isNotEmpty()) {
            GlassCard {
                Column(
                    verticalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                    ) {
                        IconContainer(
                            size = 32.dp,
                            backgroundColor = Primary.copy(alpha = 0.15f)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.TrendingUp,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = Primary
                            )
                        }
                        Text(
                            text = "Portfolio Value",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    com.sparrowinvest.fa.ui.components.charts.PortfolioValueChart(
                        historyData = historyData,
                        selectedPeriod = selectedPeriod,
                        onPeriodChange = onPeriodChange
                    )
                }
            }
        }

        // Asset Allocation Chart
        if (allocationData.isNotEmpty()) {
            GlassCard {
                Column(
                    verticalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                    ) {
                        IconContainer(
                            size = 32.dp,
                            backgroundColor = Primary.copy(alpha = 0.15f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PieChart,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = Primary
                            )
                        }
                        Text(
                            text = "Asset Allocation",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    com.sparrowinvest.fa.ui.components.charts.AllocationDonutChart(
                        allocation = allocationData,
                        totalValue = totalCurrentValue
                    )
                }
            }
        }

        // Recent Activity
        if (client.recentTransactions.isNotEmpty()) {
            GlassCard {
                Column(
                    verticalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                    ) {
                        IconContainer(
                            size = 32.dp,
                            backgroundColor = Info.copy(alpha = 0.15f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.History,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = Info
                            )
                        }
                        Column {
                            Text(
                                text = "Recent Activity",
                                style = MaterialTheme.typography.titleSmall,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Last ${client.recentTransactions.take(3).size} transactions",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    client.recentTransactions.take(3).forEach { transaction ->
                        TransactionItem(transaction = transaction)
                    }
                }
            }
        }

        // Client Details
        GlassCard {
            Column(
                verticalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    IconContainer(
                        size = 32.dp,
                        backgroundColor = Primary.copy(alpha = 0.15f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = Primary
                        )
                    }
                    Column {
                        Text(
                            text = "Client Information",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Personal details",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                DetailRow(label = "Email", value = client.email)
                client.phone?.let { DetailRow(label = "Phone", value = it) }
                client.panNumber?.let { DetailRow(label = "PAN", value = it) }
                client.riskProfile?.let { DetailRow(label = "Risk Profile", value = it) }
                client.kycStatus?.let { DetailRow(label = "KYC Status", value = it) }
                if (client.nomineeName != null && client.nomineeName.isNotEmpty()) {
                    val nomineeDisplay = if (client.nomineeRelation.isNullOrEmpty()) {
                        client.nomineeName
                    } else {
                        "${client.nomineeName} (${client.nomineeRelation})"
                    }
                    DetailRow(label = "Nominee", value = nomineeDisplay)
                } else {
                    DetailRow(label = "Nominee", value = "Not Added")
                }
                client.address?.let { DetailRow(label = "Address", value = it) }
                client.createdAt?.let { DetailRow(label = "Client Since", value = it.take(10)) }
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    icon: ImageVector,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        IconContainer(
            size = 36.dp,
            backgroundColor = color.copy(alpha = 0.1f)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(18.dp),
                tint = color
            )
        }
        Spacer(modifier = Modifier.height(Spacing.small))
        Text(
            text = value,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun InfoCard(
    title: String,
    value: String,
    subtitle: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    GlassCard(
        modifier = modifier,
        contentPadding = Spacing.compact
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                color = color
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
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
private fun HoldingsSummaryCard(holdings: List<Holding>) {
    val totalValue = holdings.sumOf { it.currentValue }
    val totalInvested = holdings.sumOf { it.investedValue }
    val totalGain = totalValue - totalInvested
    val gainPct = if (totalInvested > 0) (totalGain / totalInvested) * 100 else 0.0

    GlassCard {
        Column(
            verticalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                IconContainer(
                    size = 32.dp,
                    backgroundColor = Primary.copy(alpha = 0.15f)
                ) {
                    Icon(
                        imageVector = Icons.Default.PieChart,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = Primary
                    )
                }
                Column {
                    Text(
                        text = "Holdings Summary",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${holdings.size} funds",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Stats in 2x2 Tiles
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                StatTile(
                    label = "Current Value",
                    value = "₹${formatAmount(totalValue)}",
                    color = Primary,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    label = "Invested",
                    value = "₹${formatAmount(totalInvested)}",
                    color = Info,
                    modifier = Modifier.weight(1f)
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                StatTile(
                    label = "Gain/Loss",
                    value = "${if (totalGain >= 0) "+" else ""}₹${formatAmount(kotlin.math.abs(totalGain))}",
                    color = if (totalGain >= 0) Success else Error,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    label = "Returns",
                    value = "${if (gainPct >= 0) "+" else ""}${"%.2f".format(gainPct)}%",
                    color = if (gainPct >= 0) Success else Error,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun HoldingItem(
    holding: Holding,
    onClick: () -> Unit
) {
    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = holding.fundName,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                holding.category?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = "${"%.3f".format(holding.units)} units",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "₹${formatAmount(holding.currentValue)}",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                ReturnBadge(returnValue = holding.returnsPercentage)
            }
        }
    }
}

@Composable
private fun TransactionItem(transaction: FATransaction) {
    ListItemCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                IconContainer(
                    size = 36.dp,
                    backgroundColor = when (transaction.type.uppercase()) {
                        "BUY", "PURCHASE" -> Success.copy(alpha = 0.1f)
                        "SELL", "REDEMPTION" -> Error.copy(alpha = 0.1f)
                        else -> Primary.copy(alpha = 0.1f)
                    }
                ) {
                    Icon(
                        imageVector = when (transaction.type.uppercase()) {
                            "BUY", "PURCHASE" -> Icons.Default.ShoppingCart
                            "SELL", "REDEMPTION" -> Icons.AutoMirrored.Filled.TrendingUp
                            else -> Icons.Default.Repeat
                        },
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = when (transaction.type.uppercase()) {
                            "BUY", "PURCHASE" -> Success
                            "SELL", "REDEMPTION" -> Error
                            else -> Primary
                        }
                    )
                }
                Spacer(modifier = Modifier.width(Spacing.compact))
                Column {
                    Text(
                        text = transaction.fundName,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "${transaction.type} • ${transaction.date.take(10)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = transaction.formattedAmount,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                StatusBadge(status = transaction.status)
            }
        }
    }
}

@Composable
private fun SipSummaryCard(sips: List<FASip>) {
    val activeSips = sips.filter { it.isActive }
    val pausedSips = sips.filter { it.status.uppercase() == "PAUSED" }
    val totalMonthly = activeSips.sumOf { it.amount }
    val totalInvested = sips.sumOf { it.totalInvested }

    GlassCard {
        Column(
            verticalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                IconContainer(
                    size = 32.dp,
                    backgroundColor = Success.copy(alpha = 0.15f)
                ) {
                    Icon(
                        imageVector = Icons.Default.Repeat,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = Success
                    )
                }
                Column {
                    Text(
                        text = "SIP Summary",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${sips.size} total SIPs",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Stats in 2x2 Tiles
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                StatTile(
                    label = "Active",
                    value = "${activeSips.size}",
                    color = Success,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    label = "Monthly",
                    value = "₹${formatAmount(totalMonthly)}",
                    color = Primary,
                    modifier = Modifier.weight(1f)
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                StatTile(
                    label = "Total Invested",
                    value = "₹${formatAmount(totalInvested)}",
                    color = Info,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    label = "Paused",
                    value = "${pausedSips.size}",
                    color = if (pausedSips.isNotEmpty()) Warning else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun SipItem(sip: FASip) {
    ListItemCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(
                            if (sip.isActive) Success.copy(alpha = 0.1f)
                            else MaterialTheme.colorScheme.surfaceVariant
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${sip.sipDate}",
                            style = MaterialTheme.typography.titleSmall,
                            color = if (sip.isActive) Success else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "th",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (sip.isActive) Success else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(modifier = Modifier.width(Spacing.compact))
                Column {
                    Text(
                        text = sip.fundName,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "${sip.frequency} • ${sip.installmentsPaid} installments",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = sip.formattedAmount,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                StatusBadge(status = sip.status)
            }
        }
    }
}

@Composable
private fun GoalsSection(client: ClientDetail) {
    // Mock goals data for demo
    val goals = listOf(
        Goal("Retirement", 5000000.0, 2500000.0, "2045"),
        Goal("Child Education", 2000000.0, 800000.0, "2035"),
        Goal("Home Purchase", 3000000.0, 1500000.0, "2030")
    )

    val totalTarget = goals.sumOf { it.targetAmount }
    val totalAchieved = goals.sumOf { it.currentAmount }
    val overallProgress = if (totalTarget > 0) (totalAchieved / totalTarget) * 100 else 0.0
    val onTrackGoals = goals.count { (it.currentAmount / it.targetAmount) >= 0.5 }

    Column(
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        // Goals Summary Card
        GlassCard {
            Column(
                verticalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                // Header
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    IconContainer(
                        size = 32.dp,
                        backgroundColor = Primary.copy(alpha = 0.15f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Flag,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = Primary
                        )
                    }
                    Column {
                        Text(
                            text = "Goals Summary",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${goals.size} financial goals",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Stats in 2x2 Tiles
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    StatTile(
                        label = "Target",
                        value = "₹${formatAmount(totalTarget)}",
                        color = Primary,
                        modifier = Modifier.weight(1f)
                    )
                    StatTile(
                        label = "Achieved",
                        value = "₹${formatAmount(totalAchieved)}",
                        color = Success,
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    StatTile(
                        label = "Progress",
                        value = "${"%.1f".format(overallProgress)}%",
                        color = when {
                            overallProgress >= 75 -> Success
                            overallProgress >= 50 -> Warning
                            else -> Error
                        },
                        modifier = Modifier.weight(1f)
                    )
                    StatTile(
                        label = "On Track",
                        value = "$onTrackGoals/${goals.size}",
                        color = if (onTrackGoals >= goals.size / 2) Success else Warning,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Individual Goal Cards
        goals.forEach { goal ->
            GoalCard(goal = goal)
        }

        // Add New Goal
        GlassCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                IconContainer(
                    size = 36.dp,
                    backgroundColor = Primary.copy(alpha = 0.15f)
                ) {
                    Icon(
                        imageVector = Icons.Default.Flag,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = Primary
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Add New Goal",
                        style = MaterialTheme.typography.titleSmall,
                        color = Primary
                    )
                    Text(
                        text = "Set financial goals to track client progress",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

private data class Goal(
    val name: String,
    val targetAmount: Double,
    val currentAmount: Double,
    val targetYear: String
)

@Composable
private fun GoalCard(goal: Goal) {
    val progress = (goal.currentAmount / goal.targetAmount).coerceIn(0.0, 1.0)
    val progressColor = when {
        progress >= 0.75 -> Success
        progress >= 0.5 -> Warning
        else -> Error
    }

    GlassCard {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconContainer(
                        size = 36.dp,
                        backgroundColor = progressColor.copy(alpha = 0.1f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Flag,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = progressColor
                        )
                    }
                    Spacer(modifier = Modifier.width(Spacing.compact))
                    Column {
                        Text(
                            text = goal.name,
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Target: ${goal.targetYear}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Text(
                    text = "${(progress * 100).toInt()}%",
                    style = MaterialTheme.typography.titleMedium,
                    color = progressColor
                )
            }

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Progress bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(progress.toFloat())
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(progressColor)
                )
            }

            Spacer(modifier = Modifier.height(Spacing.small))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "₹${formatAmount(goal.currentAmount)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "₹${formatAmount(goal.targetAmount)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

// ==================== FAMILY COMPONENTS ====================

@Composable
private fun FamilyHoldingsSummary(
    members: List<FamilyMember>,
    currentClientName: String
) {
    val totalAum = members.sumOf { it.aum }
    val totalHoldings = members.sumOf { it.holdingsCount }
    val totalSips = members.sumOf { it.sipCount }
    val avgReturns = if (members.isNotEmpty()) members.map { it.returns }.average() else 0.0

    GlassCard {
        Column(
            verticalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    IconContainer(
                        size = 32.dp,
                        backgroundColor = Primary.copy(alpha = 0.15f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Groups,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = Primary
                        )
                    }
                    Column {
                        Text(
                            text = "Family Portfolio",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${members.size} members with folio",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Stats in 2x2 Tiles
            Column(
                verticalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    StatTile(
                        label = "Total AUM",
                        value = "₹${formatAmount(totalAum)}",
                        color = Primary,
                        modifier = Modifier.weight(1f)
                    )
                    StatTile(
                        label = "Avg Returns",
                        value = "${if (avgReturns >= 0) "+" else ""}${"%.1f".format(avgReturns)}%",
                        color = if (avgReturns >= 0) Success else Error,
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    StatTile(
                        label = "Holdings",
                        value = "$totalHoldings",
                        color = Info,
                        modifier = Modifier.weight(1f)
                    )
                    StatTile(
                        label = "Active SIPs",
                        value = "$totalSips",
                        color = Success,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun FamilyMemberCardV2(
    member: FamilyMember,
    isCurrentClient: Boolean,
    onClick: () -> Unit
) {
    val relationshipColor = when (member.relationship.uppercase()) {
        "SELF" -> Primary
        "SPOUSE" -> Color(0xFFE91E63) // Pink
        "CHILD" -> Success
        "PARENT" -> Warning
        "SIBLING" -> Info
        else -> MaterialTheme.colorScheme.primary
    }

    ListItemCard(
        modifier = if (member.clientId != null && !isCurrentClient) {
            Modifier.clickable(onClick = onClick)
        } else {
            Modifier
        }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                // Avatar with relationship color
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(relationshipColor.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = member.initials,
                        style = MaterialTheme.typography.titleSmall,
                        color = relationshipColor
                    )
                }

                Spacer(modifier = Modifier.width(Spacing.compact))

                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                    ) {
                        Text(
                            text = member.name,
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        // Relationship badge
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(relationshipColor.copy(alpha = 0.15f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = member.relationshipLabel,
                                style = MaterialTheme.typography.labelSmall,
                                color = relationshipColor
                            )
                        }
                        if (isCurrentClient) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(Primary.copy(alpha = 0.15f))
                                    .padding(horizontal = 4.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = "YOU",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Primary
                                )
                            }
                        }
                    }

                    // Stats row
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                    ) {
                        Text(
                            text = "${member.holdingsCount} funds",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "•",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${member.sipCount} SIPs",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (member.kycStatus != null) {
                            Text(
                                text = "•",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = member.kycStatus,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (member.kycStatus == "VERIFIED") Success else Warning
                            )
                        }
                    }
                }
            }

            // AUM and Returns
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = "₹${formatAmount(member.aum)}",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                ReturnBadge(returnValue = member.returns)
            }
        }
    }
}

// ==================== END FAMILY COMPONENTS ====================

@Composable
private fun EmptyStateCard(
    message: String,
    icon: ImageVector
) {
    GlassCard {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Spacing.large),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            IconContainer(
                size = 48.dp,
                backgroundColor = MaterialTheme.colorScheme.surfaceVariant
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(Spacing.compact))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private fun formatAmount(amount: Double): String {
    return when {
        amount >= 10000000 -> "%.2f Cr".format(amount / 10000000)
        amount >= 100000 -> "%.2f L".format(amount / 100000)
        amount >= 1000 -> "%.2f K".format(amount / 1000)
        else -> "%.0f".format(amount)
    }
}
