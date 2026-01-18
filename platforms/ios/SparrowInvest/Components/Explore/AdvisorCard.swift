//
//  AdvisorCard.swift
//  SparrowInvest
//
//  Created by Claude on 2025.
//

import SwiftUI

struct AdvisorCard: View {
    let advisor: Advisor
    var showCallbackButton: Bool = true
    var onRequestCallback: (() -> Void)? = nil
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            // Header: Avatar, Name, Rating
            HStack(spacing: AppTheme.Spacing.compact) {
                // Avatar - Icon Container (Large)
                ZStack {
                    Circle()
                        .fill(AppTheme.primaryGradient)
                        .frame(width: 48, height: 48)

                    Text(advisor.initials)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(advisor.name)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(.primary)

                    HStack(spacing: 4) {
                        // Rating stars
                        HStack(spacing: 2) {
                            Image(systemName: "star.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(.orange)
                            Text(String(format: "%.1f", advisor.rating))
                                .font(.system(size: 12, weight: .regular))
                                .foregroundStyle(.secondary)
                        }

                        Text("•")
                            .font(.system(size: 12))
                            .foregroundStyle(.tertiary)

                        Text("\(advisor.experienceYears) yrs exp")
                            .font(.system(size: 12, weight: .regular))
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                // Availability indicator - Stat Badge
                if advisor.isAvailable {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(.green)
                            .frame(width: 6, height: 6)
                        Text("Online")
                            .font(.system(size: 10, weight: .medium))
                    }
                    .foregroundColor(.green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(colorScheme == .dark ? 0.15 : 0.1), in: Capsule())
                }
            }

            // Region badge - Category Tile style
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "location.fill")
                        .font(.system(size: 10))
                    Text(advisor.region)
                        .font(.system(size: 12, weight: .medium))
                }
                .foregroundStyle(AppTheme.primary)
                .padding(.horizontal, AppTheme.Spacing.small)
                .padding(.vertical, 4)
                .background(
                    Capsule()
                        .fill(AppTheme.primary.opacity(colorScheme == .dark ? 0.15 : 0.1))
                )

                Spacer()
            }

            // Specializations - Category Tiles
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppTheme.Spacing.small) {
                    ForEach(advisor.specializations, id: \.self) { spec in
                        HStack(spacing: 4) {
                            Image(systemName: spec.icon)
                                .font(.system(size: 10))
                            Text(spec.displayName)
                                .font(.system(size: 11, weight: .medium))
                        }
                        .foregroundStyle(spec.color)
                        .padding(.horizontal, AppTheme.Spacing.small)
                        .padding(.vertical, 4)
                        .background(
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .fill(spec.color.opacity(colorScheme == .dark ? 0.15 : 0.1))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .stroke(colorScheme == .dark ? spec.color.opacity(0.2) : Color.clear, lineWidth: 0.5)
                        )
                    }
                }
            }

            // Languages
            Text("Languages: \(advisor.formattedLanguages)")
                .font(.system(size: 12, weight: .light))
                .foregroundStyle(.tertiary)

            // Request Callback button (optional)
            if showCallbackButton, let callback = onRequestCallback {
                Button(action: callback) {
                    Text("Request Callback")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, AppTheme.Spacing.compact)
                        .background(
                            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                                .fill(AppTheme.primaryGradient)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: cardShadowColor, radius: 12, x: 0, y: 4)
    }

    private var cardShadowColor: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    @ViewBuilder
    private var cardBackground: some View {
        if colorScheme == .dark {
            // Dark mode: Dark transparent glass
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            // Light mode: White with shadow
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.1), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

#Preview {
    AdvisorCard(
        advisor: Advisor(
            id: "1",
            name: "Rajesh Sharma",
            photo: nil,
            region: "Mumbai",
            phone: "+91 98765 43210",
            email: "rajesh@test.com",
            specializations: [.retirement, .taxPlanning, .hni],
            experienceYears: 15,
            rating: 4.9,
            reviewCount: 156,
            languages: ["Hindi", "English", "Marathi"],
            isAvailable: true
        ),
        showCallbackButton: true,
        onRequestCallback: { print("Callback requested") }
    )
    .padding()
}
