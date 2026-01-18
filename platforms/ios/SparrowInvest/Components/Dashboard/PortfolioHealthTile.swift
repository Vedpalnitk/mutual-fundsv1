//
//  PortfolioHealthTile.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Portfolio Health - SF Pro Light
//

import SwiftUI

struct PortfolioHealthTile: View {
    let healthScore: Int
    var onTapAnalysis: (() -> Void)?

    private var healthColor: Color {
        if healthScore >= 80 {
            return .green
        } else if healthScore >= 60 {
            return .orange
        } else {
            return .red
        }
    }

    private var healthLabel: String {
        if healthScore >= 80 {
            return "Excellent"
        } else if healthScore >= 60 {
            return "Good"
        } else if healthScore >= 40 {
            return "Fair"
        } else {
            return "Needs Attention"
        }
    }

    private var diagnostics: [(icon: String, text: String, isPositive: Bool)] {
        [
            ("checkmark.circle.fill", "Well diversified", true),
            ("checkmark.circle.fill", "On track for goals", true),
            ("exclamationmark.triangle.fill", "Rebalancing recommended", false)
        ]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Portfolio Health")
                        .font(.system(size: 16, weight: .regular))
                        .foregroundColor(.primary)

                    Text(healthLabel)
                        .font(.system(size: 13, weight: .light))
                        .foregroundColor(healthColor)
                }

                Spacer()

                // Health Score Circle
                ZStack {
                    Circle()
                        .stroke(healthColor.opacity(0.2), lineWidth: 6)
                        .frame(width: 56, height: 56)

                    Circle()
                        .trim(from: 0, to: CGFloat(healthScore) / 100)
                        .stroke(healthColor, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .frame(width: 56, height: 56)
                        .rotationEffect(.degrees(-90))

                    Text("\(healthScore)")
                        .font(.system(size: 18, weight: .light, design: .rounded))
                        .foregroundColor(healthColor)
                }
            }

            // Quick Diagnostics
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                ForEach(diagnostics.indices, id: \.self) { index in
                    let diagnostic = diagnostics[index]
                    HStack(spacing: 8) {
                        Image(systemName: diagnostic.icon)
                            .font(.system(size: 14, weight: .light))
                            .foregroundColor(diagnostic.isPositive ? .green : .orange)

                        Text(diagnostic.text)
                            .font(.system(size: 13, weight: .light))
                            .foregroundColor(.secondary)
                    }
                }
            }

            // View Full Analysis Button
            Button {
                onTapAnalysis?()
            } label: {
                HStack {
                    Text("View Full Analysis")
                        .font(.system(size: 13, weight: .regular))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 12, weight: .light))
                }
                .foregroundColor(.blue)
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }
}

#Preview {
    PortfolioHealthTile(healthScore: 78)
        .padding()
}
