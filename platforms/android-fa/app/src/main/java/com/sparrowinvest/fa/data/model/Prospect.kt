package com.sparrowinvest.fa.data.model

enum class ProspectStage(val label: String) {
    DISCOVERY("Discovery"),
    ANALYSIS("Analysis"),
    PROPOSAL("Proposal"),
    NEGOTIATION("Negotiation"),
    CLOSED_WON("Closed Won"),
    CLOSED_LOST("Closed Lost")
}

enum class LeadSource(val label: String) {
    REFERRAL("Referral"),
    WEBSITE("Website"),
    LINKEDIN("LinkedIn"),
    EVENT("Event"),
    COLD_CALL("Cold Call"),
    SOCIAL_MEDIA("Social Media"),
    OTHER("Other")
}

data class Prospect(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val potentialAum: Double,
    val stage: ProspectStage,
    val source: LeadSource,
    val nextAction: String,
    val nextActionDate: String,
    val notes: String,
    val probability: Int
)

object MockProspects {
    val prospects = listOf(
        Prospect(
            id = "p1",
            name = "Vikram Malhotra",
            email = "vikram.malhotra@gmail.com",
            phone = "+91 98765 43210",
            potentialAum = 5000000.0,
            stage = ProspectStage.PROPOSAL,
            source = LeadSource.REFERRAL,
            nextAction = "Send investment proposal",
            nextActionDate = "2025-02-15",
            notes = "Interested in equity-heavy portfolio. Currently with ICICI Direct.",
            probability = 70
        ),
        Prospect(
            id = "p2",
            name = "Anita Desai",
            email = "anita.desai@outlook.com",
            phone = "+91 87654 32109",
            potentialAum = 12000000.0,
            stage = ProspectStage.DISCOVERY,
            source = LeadSource.LINKEDIN,
            nextAction = "Schedule intro call",
            nextActionDate = "2025-02-12",
            notes = "Senior executive at TCS. Looking for retirement planning.",
            probability = 30
        ),
        Prospect(
            id = "p3",
            name = "Rahul Kapoor",
            email = "rahul.kapoor@yahoo.com",
            phone = "+91 76543 21098",
            potentialAum = 3500000.0,
            stage = ProspectStage.NEGOTIATION,
            source = LeadSource.EVENT,
            nextAction = "Finalize fee structure",
            nextActionDate = "2025-02-10",
            notes = "Met at Mumbai wealth management conference. Wants tax-efficient portfolio.",
            probability = 85
        ),
        Prospect(
            id = "p4",
            name = "Sneha Iyer",
            email = "sneha.iyer@gmail.com",
            phone = "+91 65432 10987",
            potentialAum = 8000000.0,
            stage = ProspectStage.ANALYSIS,
            source = LeadSource.WEBSITE,
            nextAction = "Review current portfolio",
            nextActionDate = "2025-02-18",
            notes = "Doctor running her own clinic. Needs SIP strategy for children's education.",
            probability = 50
        ),
        Prospect(
            id = "p5",
            name = "Deepak Joshi",
            email = "deepak.joshi@hotmail.com",
            phone = "+91 54321 09876",
            potentialAum = 2000000.0,
            stage = ProspectStage.CLOSED_WON,
            source = LeadSource.REFERRAL,
            nextAction = "Onboard client",
            nextActionDate = "2025-02-08",
            notes = "Referred by Rajesh Sharma. Signed agreement last week.",
            probability = 100
        ),
        Prospect(
            id = "p6",
            name = "Meera Reddy",
            email = "meera.reddy@gmail.com",
            phone = "+91 43210 98765",
            potentialAum = 15000000.0,
            stage = ProspectStage.PROPOSAL,
            source = LeadSource.COLD_CALL,
            nextAction = "Present goal-based plan",
            nextActionDate = "2025-02-20",
            notes = "Family business owner. Looking to diversify from real estate.",
            probability = 60
        ),
        Prospect(
            id = "p7",
            name = "Arjun Nair",
            email = "arjun.nair@company.com",
            phone = "+91 32109 87654",
            potentialAum = 4500000.0,
            stage = ProspectStage.CLOSED_LOST,
            source = LeadSource.SOCIAL_MEDIA,
            nextAction = "Follow up in 6 months",
            nextActionDate = "2025-08-01",
            notes = "Chose to go with a robo-advisor instead. May reconsider later.",
            probability = 0
        ),
        Prospect(
            id = "p8",
            name = "Kavita Menon",
            email = "kavita.menon@gmail.com",
            phone = "+91 21098 76543",
            potentialAum = 6000000.0,
            stage = ProspectStage.DISCOVERY,
            source = LeadSource.REFERRAL,
            nextAction = "Send introductory email",
            nextActionDate = "2025-02-14",
            notes = "Referred by Priya Patel. NRI returning to India, needs investment guidance.",
            probability = 25
        )
    )
}
