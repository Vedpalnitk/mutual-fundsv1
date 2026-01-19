//
//  NavigationStore.swift
//  SparrowInvest
//
//  Global navigation state for tab switching
//

import Foundation
import SwiftUI

@MainActor
class NavigationStore: ObservableObject {
    @Published var selectedTab: Tab = .home

    enum Tab: String, CaseIterable {
        case home = "Home"
        case investments = "Investments"
        case insights = "Insights"
        case explore = "Explore"
        case profile = "Profile"

        var icon: String {
            switch self {
            case .home: return "house.fill"
            case .investments: return "chart.line.uptrend.xyaxis"
            case .insights: return "sparkles"
            case .explore: return "magnifyingglass"
            case .profile: return "person.fill"
            }
        }
    }

    func switchTo(_ tab: Tab) {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            selectedTab = tab
        }
    }
}
