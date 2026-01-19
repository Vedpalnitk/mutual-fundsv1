package com.sparrowinvest.app.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.app.data.model.FamilyMember
import com.sparrowinvest.app.data.model.Relationship
import com.sparrowinvest.app.data.model.User
import com.sparrowinvest.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// Data classes for Profile screen
data class UserPoints(
    val totalPoints: Int = 1250,
    val tier: PointsTier = PointsTier.SILVER,
    val pointsToNextTier: Int = 750,
    val lifetimePoints: Int = 2500
)

enum class PointsTier(val displayName: String, val color: Long, val minPoints: Int) {
    BRONZE("Bronze", 0xFFCD7F32, 0),
    SILVER("Silver", 0xFFC0C0C0, 500),
    GOLD("Gold", 0xFFFFD700, 2000),
    PLATINUM("Platinum", 0xFFE5E4E2, 5000)
}

data class ConnectedAccount(
    val id: String,
    val platform: TradingPlatform,
    val isConnected: Boolean,
    val lastSynced: String? = null
)

enum class TradingPlatform(val displayName: String, val color: Long) {
    ZERODHA("Zerodha", 0xFF387ED1),
    GROWW("Groww", 0xFF00D09C),
    KUVERA("Kuvera", 0xFF5B5FC7),
    COIN("Coin by Zerodha", 0xFF387ED1),
    PAYTM_MONEY("Paytm Money", 0xFF00BAF2)
}

data class LinkedBank(
    val id: String,
    val bankName: String,
    val accountNumber: String, // Last 4 digits
    val isPrimary: Boolean = false
)

data class Document(
    val id: String,
    val name: String,
    val type: DocumentType,
    val status: DocumentStatus,
    val uploadedAt: String? = null
)

enum class DocumentType(val displayName: String) {
    PAN("PAN Card"),
    AADHAAR("Aadhaar"),
    ADDRESS_PROOF("Address Proof"),
    BANK_STATEMENT("Bank Statement"),
    INCOME_PROOF("Income Proof")
}

enum class DocumentStatus {
    VERIFIED, PENDING, REJECTED, NOT_UPLOADED
}

data class Advisor(
    val id: String,
    val name: String,
    val firm: String,
    val rating: Double,
    val specialization: String,
    val isAssigned: Boolean = false
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    val currentUser: StateFlow<User?> = authRepository.currentUser

    private val _userPoints = MutableStateFlow(UserPoints())
    val userPoints: StateFlow<UserPoints> = _userPoints.asStateFlow()

    private val _familyMembers = MutableStateFlow<List<FamilyMember>>(emptyList())
    val familyMembers: StateFlow<List<FamilyMember>> = _familyMembers.asStateFlow()

    private val _connectedAccounts = MutableStateFlow<List<ConnectedAccount>>(emptyList())
    val connectedAccounts: StateFlow<List<ConnectedAccount>> = _connectedAccounts.asStateFlow()

    private val _linkedBanks = MutableStateFlow<List<LinkedBank>>(emptyList())
    val linkedBanks: StateFlow<List<LinkedBank>> = _linkedBanks.asStateFlow()

    private val _documents = MutableStateFlow<List<Document>>(emptyList())
    val documents: StateFlow<List<Document>> = _documents.asStateFlow()

    private val _assignedAdvisor = MutableStateFlow<Advisor?>(null)
    val assignedAdvisor: StateFlow<Advisor?> = _assignedAdvisor.asStateFlow()

    private val _isPremium = MutableStateFlow(false)
    val isPremium: StateFlow<Boolean> = _isPremium.asStateFlow()

    private val _profileCompletion = MutableStateFlow(65)
    val profileCompletion: StateFlow<Int> = _profileCompletion.asStateFlow()

    init {
        loadProfileData()
    }

    private fun loadProfileData() {
        viewModelScope.launch {
            // Load mock data
            _userPoints.value = UserPoints(
                totalPoints = 1250,
                tier = PointsTier.SILVER,
                pointsToNextTier = 750,
                lifetimePoints = 2500
            )

            _familyMembers.value = listOf(
                FamilyMember(
                    id = "1",
                    name = "Priya Sharma",
                    relationship = Relationship.SPOUSE,
                    portfolioValue = 185420.0,
                    contribution = 34.0
                ),
                FamilyMember(
                    id = "2",
                    name = "Arun Sharma",
                    relationship = Relationship.PARENT,
                    portfolioValue = 115230.0,
                    contribution = 21.0
                )
            )

            _connectedAccounts.value = listOf(
                ConnectedAccount(
                    id = "1",
                    platform = TradingPlatform.ZERODHA,
                    isConnected = true,
                    lastSynced = "Jan 19, 2026"
                ),
                ConnectedAccount(
                    id = "2",
                    platform = TradingPlatform.GROWW,
                    isConnected = false
                ),
                ConnectedAccount(
                    id = "3",
                    platform = TradingPlatform.KUVERA,
                    isConnected = true,
                    lastSynced = "Jan 18, 2026"
                )
            )

            _linkedBanks.value = listOf(
                LinkedBank(
                    id = "1",
                    bankName = "HDFC Bank",
                    accountNumber = "4521",
                    isPrimary = true
                ),
                LinkedBank(
                    id = "2",
                    bankName = "ICICI Bank",
                    accountNumber = "7834",
                    isPrimary = false
                )
            )

            _documents.value = listOf(
                Document(
                    id = "1",
                    name = "PAN Card",
                    type = DocumentType.PAN,
                    status = DocumentStatus.VERIFIED,
                    uploadedAt = "Dec 15, 2025"
                ),
                Document(
                    id = "2",
                    name = "Aadhaar Card",
                    type = DocumentType.AADHAAR,
                    status = DocumentStatus.VERIFIED,
                    uploadedAt = "Dec 15, 2025"
                ),
                Document(
                    id = "3",
                    name = "Address Proof",
                    type = DocumentType.ADDRESS_PROOF,
                    status = DocumentStatus.PENDING
                ),
                Document(
                    id = "4",
                    name = "Bank Statement",
                    type = DocumentType.BANK_STATEMENT,
                    status = DocumentStatus.NOT_UPLOADED
                )
            )

            _assignedAdvisor.value = Advisor(
                id = "1",
                name = "Rajesh Kumar",
                firm = "Wealth First Advisors",
                rating = 4.8,
                specialization = "Mutual Funds & Tax Planning",
                isAssigned = true
            )

            _isPremium.value = false
            _profileCompletion.value = 75
        }
    }

    fun connectAccount(platform: TradingPlatform) {
        // TODO: Implement account connection
    }

    fun disconnectAccount(accountId: String) {
        // TODO: Implement account disconnection
    }

    fun addFamilyMember() {
        // TODO: Implement add family member
    }

    fun removeFamilyMember(memberId: String) {
        // TODO: Implement remove family member
    }

    fun upgradeToPremium() {
        // TODO: Implement premium upgrade
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}
