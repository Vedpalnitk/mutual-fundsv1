"""
CAS (Consolidated Account Statement) PDF parsing schemas.
"""

from pydantic import BaseModel, Field


class CASTransactionOut(BaseModel):
    date: str
    description: str
    amount: float | None = None
    units: float | None = None
    nav: float | None = None
    balance: float | None = None
    type: str = Field(default="UNKNOWN", description="PURCHASE, REDEMPTION, SWITCH_IN, etc.")


class CASSchemeOut(BaseModel):
    scheme: str
    isin: str | None = None
    amfi: str | None = None
    rta: str = Field(description="CAMS or KFINTECH")
    rta_code: str = ""
    advisor: str | None = None
    type: str | None = None
    open: float = 0.0
    close: float = 0.0
    valuation_date: str | None = None
    valuation_nav: float | None = None
    valuation_value: float | None = None
    cost: float | None = None
    transactions: list[CASTransactionOut] = []


class CASFolioOut(BaseModel):
    folio: str
    amc: str
    pan: str | None = None
    kyc: str | None = None
    schemes: list[CASSchemeOut] = []


class CASParseResponse(BaseModel):
    investor_name: str = ""
    investor_email: str = ""
    investor_mobile: str = ""
    cas_type: str = Field(default="DETAILED", description="DETAILED or SUMMARY")
    file_type: str = Field(default="CAMS", description="CAMS or KFINTECH")
    statement_period_from: str = ""
    statement_period_to: str = ""
    folios: list[CASFolioOut] = []
    total_schemes: int = 0
    total_current_value: float = 0.0
