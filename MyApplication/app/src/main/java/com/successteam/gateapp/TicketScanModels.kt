package com.successteam.gateapp

data class GateAttendee(
    val key: String,
    val name: String,
    val seatLabel: String = "",
    val whatsapp: String = "",
    val lunch: String = "",
    val checkedIn: Boolean = false,
    val checkedInAt: String? = null,
    val checkedInBy: String? = null
)

data class GateTicketSnapshot(
    val status: String,
    val name: String,
    val seminar: String,
    val venue: String,
    val seats: String,
    val price: String,
    val reason: String,
    val bookingId: String = "-",
    val date: String = "-",
    val phone: String = "",
    val attendees: List<GateAttendee> = emptyList(),
    val approvalsEnabled: Boolean = true
)
