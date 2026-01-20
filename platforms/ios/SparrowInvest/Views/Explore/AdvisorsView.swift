//
//  AdvisorsView.swift
//  SparrowInvest
//
//  Created by Claude on 2025.
//

import SwiftUI

struct AdvisorsView: View {
    @EnvironmentObject var advisorStore: AdvisorStore
    @State private var selectedRegion: String? = nil

    private var displayedAdvisors: [Advisor] {
        if let region = selectedRegion {
            return advisorStore.advisors.filter { $0.region == region }
        }
        return advisorStore.advisors
    }

    var body: some View {
        ScrollView {
            VStack(spacing: AppTheme.Spacing.large) {
                // Region Filter
                RegionFilterSection(
                    regions: advisorStore.allRegions,
                    selectedRegion: $selectedRegion,
                    userRegion: advisorStore.userRegion
                )

                // Show advisors based on filter
                if selectedRegion == nil {
                    // Your Region Section
                    if !advisorStore.advisorsInUserRegion.isEmpty {
                        AdvisorSection(
                            title: "Your Region",
                            subtitle: advisorStore.userRegion,
                            advisors: advisorStore.advisorsInUserRegion
                        )
                    }

                    // Other Regions Section
                    if !advisorStore.advisorsInOtherRegions.isEmpty {
                        AdvisorSection(
                            title: "Other Regions",
                            advisors: advisorStore.advisorsInOtherRegions
                        )
                    }
                } else {
                    // Filtered by specific region
                    AdvisorSection(
                        title: selectedRegion!,
                        advisors: displayedAdvisors
                    )
                }
            }
            .padding(AppTheme.Spacing.medium)
        }
        .background(AppTheme.groupedBackground)
        .navigationTitle("Find Advisor")
        .navigationBarTitleDisplayMode(.large)
    }
}

// MARK: - Region Filter Section

private struct RegionFilterSection: View {
    let regions: [String]
    @Binding var selectedRegion: String?
    let userRegion: String

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            Text("Filter by Region")
                .font(.system(size: 12, weight: .regular))
                .foregroundStyle(.secondary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppTheme.Spacing.small) {
                    FilterChip(
                        title: "All",
                        isSelected: selectedRegion == nil,
                        action: { selectedRegion = nil }
                    )

                    ForEach(regions, id: \.self) { region in
                        FilterChip(
                            title: region,
                            isSelected: selectedRegion == region,
                            isUserRegion: region == userRegion,
                            action: { selectedRegion = region }
                        )
                    }
                }
            }
        }
    }
}

private struct FilterChip: View {
    let title: String
    let isSelected: Bool
    var isUserRegion: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(title)
                    .font(.system(size: 12, weight: .regular))
                    .fontWeight(isSelected ? .medium : .regular)

                if isUserRegion {
                    Image(systemName: "location.fill")
                        .font(.system(size: 10))
                }
            }
            .foregroundStyle(isSelected ? .white : .primary)
            .padding(.horizontal, AppTheme.Spacing.compact)
            .padding(.vertical, AppTheme.Spacing.small)
            .background(
                Capsule()
                    .fill(isSelected ? AppTheme.primary : AppTheme.secondaryFill)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Advisor Section

private struct AdvisorSection: View {
    let title: String
    var subtitle: String? = nil
    let advisors: [Advisor]

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            HStack {
                Text(title)
                    .font(.system(size: 16, weight: .regular))
                    .foregroundStyle(.primary)

                if let subtitle = subtitle {
                    Text("• \(subtitle)")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text("\(advisors.count) \(advisors.count == 1 ? "advisor" : "advisors")")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(Color(uiColor: .tertiaryLabel))
            }

            ForEach(advisors) { advisor in
                NavigationLink(destination: AdvisorDetailView(advisor: advisor)) {
                    AdvisorCard(advisor: advisor, showCallbackButton: false)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

#Preview {
    NavigationStack {
        AdvisorsView()
            .environmentObject(AdvisorStore())
    }
}
