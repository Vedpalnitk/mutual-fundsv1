//
//  QuickAccessCard.swift
//  SparrowInvest
//
//  Created by Claude on 2025.
//

import SwiftUI

struct QuickAccessCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let value: String
    let subtitle: String

    @Environment(\.colorScheme) private var colorScheme

    private var cardBackgroundColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color(uiColor: .white)
    }

    private var cardBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.2) : Color.blue.opacity(0.15)
    }

    private var cardShadowColor: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.15)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            // Header with icon and title
            HStack(spacing: AppTheme.Spacing.small) {
                iconContainer
                Text(title)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            // Value
            Text(value)
                .font(.system(size: 16, weight: .light))
                .foregroundStyle(.primary)

            // Subtitle
            Text(subtitle)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(iconColor)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: cardShadowColor, radius: 12, x: 0, y: 4)
    }

    private var iconContainer: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(iconColor.opacity(0.15))
                .frame(width: 32, height: 32)

            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(iconColor)
        }
    }

    @ViewBuilder
    private var cardBackground: some View {
        if colorScheme == .dark {
            // Glass effect for dark mode
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.white)
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
    HStack(spacing: AppTheme.Spacing.compact) {
        QuickAccessCard(
            icon: "star.fill",
            iconColor: Color(red: 1.0, green: 0.84, blue: 0.0),
            title: "Points",
            value: "2,450 pts",
            subtitle: "Gold Tier"
        )

        QuickAccessCard(
            icon: "person.2.fill",
            iconColor: .blue,
            title: "Find Advisor",
            value: "12 nearby",
            subtitle: "Browse All →"
        )
    }
    .padding()
    .background(Color.gray.opacity(0.1))
}
