package com.example.myapplication

data class GateAttendee(
    val key: String,
    val name: String,
    val seatLabel: String = "",
    val whatsapp: String = "",
    val lunch: String = ""
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
