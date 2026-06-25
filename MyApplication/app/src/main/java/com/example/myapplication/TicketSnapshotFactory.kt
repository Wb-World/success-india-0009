package com.example.myapplication

import com.google.gson.JsonElement
import com.google.gson.JsonObject

object TicketSnapshotFactory {

    fun fromQrDetails(qrDetails: Map<String, String>, note: String = ""): GateTicketSnapshot {
        val event = qrDetails["EVENT"] ?: qrDetails["EVENT_NAME"] ?: "-"
        val seatsRaw = qrDetails["SEATS"] ?: qrDetails["SEAT"] ?: "-"
        val venue = qrDetails["VENUE"] ?: "-"
        val rawDate = qrDetails["DATE"] ?: "-"
        val rawTime = qrDetails["TIME"] ?: ""
        val amount = cleanMoney(qrDetails["AMOUNT"] ?: "-")
        val phone = cleanPhone(qrDetails["PHONE"] ?: "")
        val statusRaw = qrDetails["STATUS"] ?: "PENDING_VERIFICATION"
        val attendees = parseAttendeesFromQr(qrDetails, parseSeatList(seatsRaw))
        val name = resolveDisplayName(attendees, qrDetails["ATTENDEE"] ?: qrDetails["ATTENDEES"] ?: "")
        val (status, reason) = normalizeQrStatus(statusRaw, note)
        val displayDate = formatDateTime(rawDate, rawTime)
        val approvalsEnabled = parseSeatList(seatsRaw).size == 1 || attendees.size > 1

        return GateTicketSnapshot(
            status = status,
            name = name,
            seminar = event,
            venue = venue,
            seats = seatsRaw,
            price = amount,
            reason = reason,
            bookingId = qrDetails["BOOKING"] ?: qrDetails["BOOKING_ID"] ?: "-",
            date = displayDate,
            phone = phone,
            attendees = attendees,
            approvalsEnabled = approvalsEnabled
        )
    }

    fun fromBooking(
        booking: JsonObject,
        bookingIdFallback: String = "-",
        fallbackQr: Map<String, String>? = null
    ): GateTicketSnapshot {
        val rawStatus = booking.firstStringValue("status", fallback = fallbackQr?.get("STATUS") ?: "unknown")
        val normalizedStatus = normalizeBookingStatus(rawStatus)

        val bookingId = booking.firstStringValue(
            "id",
            fallback = bookingIdFallback.ifBlank {
                fallbackQr?.get("BOOKING")
                    ?: fallbackQr?.get("BOOKING_ID")
                    ?: "-"
            }
        )

        val event = booking.firstStringValue(
            "seminar_name",
            "bus_name",
            fallback = fallbackQr?.get("EVENT") ?: fallbackQr?.get("EVENT_NAME") ?: "-"
        )
        val venue = booking.firstStringValue("source", fallback = fallbackQr?.get("VENUE") ?: "-")
        val date = booking.firstStringValue("date", fallback = fallbackQr?.get("DATE") ?: "-")
        val time = booking.firstStringValue("time", fallback = fallbackQr?.get("TIME") ?: "")
        val price = cleanMoney(booking.firstStringValue("total_price", fallback = fallbackQr?.get("AMOUNT") ?: "-"))
        val phone = cleanPhone(
            booking.firstStringValue(
                "booker_phone",
                fallback = fallbackQr?.get("PHONE") ?: ""
            )
        )

        val seatsList = parseSeatsFromJson(booking.get("seats"))
        val seats = if (seatsList.isNotEmpty()) seatsList.joinToString(", ") else (fallbackQr?.get("SEATS") ?: fallbackQr?.get("SEAT") ?: "-")
        val attendees = parseAttendeesFromBooking(booking, seatsList, fallbackQr)
        val name = resolveDisplayName(attendees, resolveFallbackName(booking, fallbackQr))
        val reason = resolveBookingReason(normalizedStatus, rawStatus)
        val displayDate = formatDateTime(date, time)

        return GateTicketSnapshot(
            status = normalizedStatus,
            name = name,
            seminar = event,
            venue = venue,
            seats = seats,
            price = price,
            reason = reason,
            bookingId = bookingId,
            date = displayDate,
            phone = phone,
            attendees = attendees,
            approvalsEnabled = true
        )
    }

    private fun normalizeQrStatus(status: String, note: String): Pair<String, String> {
        val trimmedNote = note.trim()
        return when (status.uppercase()) {
            "APPROVED", "CONFIRMED", "VALID", "SUCCESS" -> "approved" to trimmedNote
            "PENDING_VERIFICATION", "PENDING" -> {
                val reason = buildString {
                    append("This booking exists in local ticket data but payment is awaiting admin confirmation.")
                    if (trimmedNote.isNotBlank()) append("\n\n($trimmedNote)")
                }
                "pending" to reason
            }
            else -> {
                val reason = buildString {
                    append("Status in local ticket data: $status")
                    if (trimmedNote.isNotBlank()) append("\n\n($trimmedNote)")
                }
                "denied" to reason
            }
        }
    }

    private fun normalizeBookingStatus(status: String): String {
        return when (status.lowercase()) {
            "approved", "confirmed", "valid", "success" -> "approved"
            "pending" -> "pending"
            "denied", "rejected" -> "denied"
            else -> "error"
        }
    }

    private fun resolveBookingReason(normalizedStatus: String, rawStatus: String): String {
        return when (normalizedStatus) {
            "approved" -> ""
            "pending" -> "This booking exists but payment is awaiting admin confirmation before entry is allowed."
            "denied" -> "This booking was explicitly rejected/denied by the admin."
            else -> "Status \"$rawStatus\" is unrecognized. Entry not permitted."
        }
    }

    private fun resolveFallbackName(booking: JsonObject, fallbackQr: Map<String, String>?): String {
        val userName = extractNestedUserName(booking)
        if (userName.isNotBlank()) return userName
        val fallback = fallbackQr?.get("ATTENDEE") ?: fallbackQr?.get("ATTENDEES") ?: ""
        return fallback.substringAfter("=", fallback).trim()
    }

    private fun extractNestedUserName(booking: JsonObject): String {
        val usersEl = booking.get("users") ?: return ""
        if (usersEl.isJsonNull) return ""
        return if (usersEl.isJsonArray) {
            val arr = usersEl.asJsonArray
            val user = if (arr.size() > 0) arr[0].asJsonObject else JsonObject()
            user.firstStringValue("name", fallback = "")
        } else {
            val user = usersEl.asJsonObject
            user.firstStringValue("name", fallback = "")
        }
    }

    private fun parseAttendeesFromBooking(
        booking: JsonObject,
        seatsHint: List<String>,
        fallbackQr: Map<String, String>?
    ): List<GateAttendee> {
        val attendees = mutableListOf<GateAttendee>()
        val detailsEl = booking.get("attendee_details")
        val detailsObj = if (detailsEl != null && detailsEl.isJsonObject) detailsEl.asJsonObject else null

        if (detailsObj != null && detailsObj.entrySet().isNotEmpty()) {
            val seen = mutableSetOf<String>()
            for (seat in seatsHint) {
                val entry = detailsObj.get(seat)
                if (entry != null && !entry.isJsonNull) {
                    attendees.add(parseAttendeeEntry(seat, entry, seatsHint))
                    seen.add(seat)
                }
            }
            detailsObj.entrySet().forEach { entry ->
                if (!seen.contains(entry.key)) {
                    attendees.add(parseAttendeeEntry(entry.key, entry.value, seatsHint))
                }
            }
        }

        if (attendees.isEmpty()) {
            attendees.addAll(parseAttendeesFromQr(fallbackQr.orEmpty(), seatsHint))
        }

        return attendees
    }

    private fun parseAttendeeEntry(
        key: String,
        element: JsonElement,
        seatsHint: List<String>
    ): GateAttendee {
        val fallbackSeat = seatsHint.firstOrNull().orEmpty()
        val label = if (key.isNotBlank()) key else fallbackSeat.ifBlank { "Attendee" }

        return when {
            element.isJsonObject -> {
                val obj = element.asJsonObject
                val name = obj.firstStringValue("name", fallback = "Guest")
                val whatsapp = obj.firstStringValue("whatsapp", fallback = "")
                val lunch = obj.firstStringValue("lunch", fallback = "")
                GateAttendee(
                    key = if (key.isNotBlank()) key else label,
                    name = name,
                    seatLabel = label,
                    whatsapp = whatsapp,
                    lunch = lunch
                )
            }
            element.isJsonPrimitive -> {
                val name = element.asString.trim().ifBlank { "Guest" }
                GateAttendee(
                    key = if (key.isNotBlank()) key else label,
                    name = name,
                    seatLabel = label
                )
            }
            else -> GateAttendee(
                key = if (key.isNotBlank()) key else label,
                name = "Guest",
                seatLabel = label
            )
        }
    }

    private fun parseAttendeesFromQr(qrDetails: Map<String, String>, seatsHint: List<String>): List<GateAttendee> {
        val attendeesRaw = qrDetails["ATTENDEES"].orEmpty().trim()
        val directAttendee = qrDetails["ATTENDEE"].orEmpty().trim()
        if (attendeesRaw.isBlank() && directAttendee.isBlank()) return emptyList()

        val seatHint = seatsHint.firstOrNull().orEmpty()
        val items = when {
            attendeesRaw.isNotBlank() -> attendeesRaw.split(",")
            directAttendee.isNotBlank() -> listOf("Name=$directAttendee")
            else -> emptyList()
        }

        return items.mapIndexedNotNull { index, item ->
            val cleaned = item.trim()
            if (cleaned.isBlank()) return@mapIndexedNotNull null

            val parts = cleaned.split("=", limit = 2)
            val key = if (parts.size == 2) parts[0].trim() else "attendee-${index + 1}"
            val name = if (parts.size == 2) parts[1].trim() else cleaned
            val normalizedKey = when {
                key.isBlank() -> seatHint.ifBlank { "attendee-${index + 1}" }
                key.equals("name", ignoreCase = true) && seatHint.isNotBlank() -> seatHint
                key.equals("attendee", ignoreCase = true) && seatHint.isNotBlank() -> seatHint
                else -> key
            }
            val seatLabel = if (seatHint.isNotBlank() && items.size == 1 && normalizedKey == seatHint) seatHint else normalizedKey
            GateAttendee(
                key = normalizedKey,
                name = name.ifBlank { "Guest" },
                seatLabel = seatLabel,
                whatsapp = "",
                lunch = ""
            )
        }
    }

    private fun parseSeatsFromJson(element: JsonElement?): List<String> {
        if (element == null || element.isJsonNull) return emptyList()
        return when {
            element.isJsonArray -> element.asJsonArray.mapNotNull { item -> item.asStringOrNull()?.trim()?.takeIf { it.isNotBlank() } }
            element.isJsonPrimitive -> parseSeatList(element.asString)
            else -> emptyList()
        }
    }

    private fun parseSeatList(raw: String?): List<String> {
        val text = raw.orEmpty().trim()
        if (text.isBlank()) return emptyList()
        return text.split(",").map { it.trim() }.filter { it.isNotBlank() }
    }

    private fun cleanMoney(raw: String): String {
        val clean = raw.replace("INR", "").replace("₹", "").trim()
        return if (clean.isBlank()) "-" else clean
    }

    private fun cleanPhone(raw: String): String {
        val clean = raw.trim()
        return if (clean.isBlank() || clean == "-" || clean == "—") "" else clean
    }

    private fun formatDateTime(date: String, time: String = ""): String {
        if (date.isBlank() || date == "-") return "-"
        return if (time.isNotBlank() && time != "-") {
            "$date  •  $time"
        } else if (date.contains("T")) {
            val datePart = date.substringBefore("T")
            val timePart = date.substringAfter("T")
            val cleanTime = if (timePart.contains("+")) {
                timePart.substringBefore("+")
            } else if (timePart.contains("Z")) {
                timePart.substringBefore("Z")
            } else {
                timePart
            }
            val shortTime = if (cleanTime.length >= 5) cleanTime.substring(0, 5) else cleanTime
            "$datePart  •  $shortTime"
        } else {
            date
        }
    }

    private fun resolveDisplayName(attendees: List<GateAttendee>, fallback: String): String {
        return when {
            attendees.size > 1 -> "${attendees.size} attendees"
            attendees.size == 1 -> attendees.first().name.ifBlank { fallback.ifBlank { "Ticket Holder" } }
            fallback.isNotBlank() -> fallback.substringAfter("=", fallback).trim().ifBlank { "Ticket Holder" }
            else -> "Ticket Holder"
        }
    }

    private fun JsonObject.firstStringValue(vararg keys: String, fallback: String): String {
        for (key in keys) {
            val value = get(key)
            if (value != null && !value.isJsonNull) {
                val text = value.asStringOrNull()
                if (!text.isNullOrBlank()) return text
            }
        }
        return fallback
    }

    private fun JsonElement.asStringOrNull(): String? {
        return try {
            if (isJsonNull) null else asString
        } catch (_: Exception) {
            null
        }
    }
}

