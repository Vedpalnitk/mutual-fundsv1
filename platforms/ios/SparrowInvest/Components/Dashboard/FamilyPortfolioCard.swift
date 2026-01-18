//
//  FamilyPortfolioCard.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Family Portfolio Card
//

import SwiftUI

struct FamilyPortfolioCard: View {
    let familyPortfolio: FamilyPortfolio
    var onMemberTap: ((FamilyMember) -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            HStack {
                Text("Family Portfolio")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.primary)

                Spacer()

                NavigationLink(destination: Text("Family Details")) {
                    HStack(spacing: 4) {
                        Text("View All")
                            .font(.system(size: 13, weight: .light))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .regular))
                    }
                    .foregroundColor(.blue)
                }
            }

            // Total Value
            VStack(alignment: .leading, spacing: 4) {
                Text("Combined Value")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)

                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(familyPortfolio.totalValue.currencyFormatted)
                        .font(.system(size: 24, weight: .light, design: .rounded))
                        .foregroundColor(.primary)

                    Text("+\(familyPortfolio.returnsPercentage.percentFormatted)")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.green)
                }
            }

            // Members List
            VStack(spacing: AppTheme.Spacing.small) {
                ForEach(familyPortfolio.linkedMembers.prefix(4)) { member in
                    FamilyMemberRow(member: member)
                        .onTapGesture {
                            onMemberTap?(member)
                        }
                }
            }

            // Add Member Button
            if familyPortfolio.members.count < 5 {
                Button {
                    // Add member action
                } label: {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 16))
                        Text("Add Family Member")
                            .font(.system(size: 13, weight: .light))
                    }
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        Color.blue.opacity(0.1),
                        in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                    )
                }
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }
}

struct FamilyMemberRow: View {
    let member: FamilyMember

    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            ZStack {
                Circle()
                    .fill(member.relationship.color.opacity(0.15))
                    .frame(width: 40, height: 40)

                Text(member.initials)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(member.relationship.color)
            }

            // Info
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(member.name)
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.primary)

                    if member.relationship == .myself {
                        Text("You")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.blue)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(
                                Color.blue.opacity(0.1),
                                in: Capsule()
                            )
                    }
                }

                Text(member.relationship.displayName)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Value & Contribution
            VStack(alignment: .trailing, spacing: 2) {
                Text(member.portfolioValue.currencyFormatted)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(.primary)

                Text("\(Int(member.contribution))%")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)
            }
        }
        .padding(10)
        .background(
            Color(uiColor: .tertiarySystemFill),
            in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
        )
    }
}

#Preview {
    FamilyPortfolioCard(familyPortfolio: .empty)
        .padding()
}
