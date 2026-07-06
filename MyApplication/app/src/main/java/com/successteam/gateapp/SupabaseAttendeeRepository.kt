package com.successteam.gateapp

import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Flat representation of a single attendee across all bookings,
 * used to populate the global Entered / Unentered lists.
 */
data class GlobalAttendee(
    val bookingId: String,
    val seatKey: String,           // key inside attendee_details
    val name: String,
    val seatLabel: String,
    val whatsapp: String = "",
    val lunch: String = "",
    val eventName: String = "",
    val checkedIn: Boolean = false,
    val checkedInAt: String? = null,
    val bookingStatus: String = "approved"
)

/**
 * Direct-to-Supabase repository.
 * Fetches approved bookings and their attendee_details, then lets the gate
 * app mark individual attendees as checked-in via PATCH.
 */
object SupabaseAttendeeRepository {

    private const val SUPABASE_URL = "https://raypwndyjclstbqxrahm.supabase.co"

    // Service role key is required to bypass Row Level Security on the bookings table.
    // This key must only be used in this internal gate staff application.
    private const val SUPABASE_SERVICE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheXB3bmR5amNsc3RicXhyYWhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMxMzk4MSwiZXhwIjoyMDk2ODg5OTgxfQ._1e3arGCq2WQ8vfiXk7UXJKDMelGl5pHJySXERd_B4U"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val JSON_MEDIA = "application/json".toMediaType()

    // ── Headers ───────────────────────────────────────────────────────────────

    private fun Request.Builder.addSupabaseHeaders(): Request.Builder = this
        .addHeader("apikey", SUPABASE_SERVICE_KEY)
        .addHeader("Authorization", "Bearer $SUPABASE_SERVICE_KEY")
        .addHeader("Content-Type", "application/json")
        .addHeader("Accept", "application/json")

    /**
     * Fetches a single booking directly from Supabase by its booking ID (id).
     * Returns a parsed GateTicketSnapshot if found, or null otherwise.
     */
    fun fetchBooking(bookingId: String): GateTicketSnapshot? {
        return try {
            val url = "$SUPABASE_URL/rest/v1/bookings" +
                    "?select=id,status,attendee_details,screenshot,seats,bus_name,source,destination,total_price" +
                    "&id=eq.$bookingId"

            val request = Request.Builder()
                .url(url)
                .addSupabaseHeaders()
                .get()
                .build()

            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: "[]"

            if (!response.isSuccessful) return null

            val array = JsonParser.parseString(body).asJsonArray
            if (array.size() == 0) return null

            val booking = array[0].asJsonObject
            TicketSnapshotFactory.fromBooking(booking, bookingId)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // ── Fetch all approved bookings with attendees ─────────────────────────────

    /**
     * Returns all GlobalAttendee records from approved bookings.
     * Throws on network/parse errors so the caller can show a proper UI.
     */
    @Throws(Exception::class)
    fun fetchAllAttendees(): List<GlobalAttendee> {
        // Select only the columns we need for the attendee list
        val url = "$SUPABASE_URL/rest/v1/bookings" +
                "?select=id,status,attendee_details,screenshot,seats,bus_name,source,destination" +
                "&status=eq.approved" +
                "&order=id.asc"

        val request = Request.Builder()
            .url(url)
            .addSupabaseHeaders()
            .get()
            .build()

        val response = client.newCall(request).execute()
        val body = response.body?.string() ?: "[]"

        if (!response.isSuccessful) {
            throw Exception("Supabase error ${response.code}: $body")
        }

        val array: JsonArray = JsonParser.parseString(body).asJsonArray
        val result = mutableListOf<GlobalAttendee>()

        for (element in array) {
            val booking = element.asJsonObject
            val bookingId = booking.strOrBlank("id")
            if (bookingId.isBlank()) continue

            val bookingStatus = booking.strOrBlank("status").ifBlank { "pending" }

            val eventName = booking.strOrBlank("seminar_name")
                .ifBlank { booking.strOrBlank("bus_name") }
                .ifBlank { booking.strOrBlank("destination") }
                .ifBlank { "Event" }

            val details = getResolvedAttendeeDetails(booking)
            val cleanEntries = details.entrySet().filter { !it.key.startsWith("__") }

            if (cleanEntries.isEmpty()) {
                // If details is completely empty, check seats list fallback
                val seatsList = parseSeatsArray(booking.get("seats"))
                if (seatsList.isNotEmpty()) {
                    for (seat in seatsList) {
                        result.add(
                            GlobalAttendee(
                                bookingId = bookingId,
                                seatKey = seat,
                                name = booking.strOrBlank("booker_name").ifBlank { "Ticket Holder" },
                                seatLabel = seat,
                                eventName = eventName,
                                checkedIn = false,
                                bookingStatus = bookingStatus
                            )
                        )
                    }
                } else {
                    // Absolute fallback
                    result.add(
                        GlobalAttendee(
                            bookingId = bookingId,
                            seatKey = bookingId,
                            name = booking.strOrBlank("booker_name").ifBlank { "Ticket Holder" },
                            seatLabel = "-",
                            eventName = eventName,
                            checkedIn = false,
                            bookingStatus = bookingStatus
                        )
                    )
                }
                continue
            }

            for ((key, value) in cleanEntries) {
                if (value.isJsonNull) continue
                val attendee = parseAttendeeDetail(
                    bookingId = bookingId,
                    seatKey = key,
                    value = value,
                    eventName = eventName,
                    bookingStatus = bookingStatus
                )
                result.add(attendee)
            }
        }

        return result
    }

    private fun getResolvedAttendeeDetails(booking: JsonObject): JsonObject {
        val detailsEl = booking.get("attendee_details")
        if (detailsEl != null && !detailsEl.isJsonNull && detailsEl.isJsonObject) {
            val detailsObj = detailsEl.asJsonObject
            if (detailsObj.entrySet().any { !it.key.startsWith("__") }) {
                return detailsObj
            }
        }

        // Fallback: screenshot
        val screenshotEl = booking.get("screenshot")
        if (screenshotEl != null && !screenshotEl.isJsonNull) {
            val screenshotStr = screenshotEl.asString
            if (screenshotStr.contains("|")) {
                try {
                    val parts = screenshotStr.split("|")
                    if (parts.size > 1) {
                        val parsed = JsonParser.parseString(parts[1])
                        if (parsed.isJsonObject) {
                            return parsed.asJsonObject
                        }
                    }
                } catch (_: Exception) {}
            }
        }

        return JsonObject()
    }

    private fun parseSeatsArray(seatsEl: com.google.gson.JsonElement?): List<String> {
        if (seatsEl == null || seatsEl.isJsonNull) return emptyList()
        val list = mutableListOf<String>()
        try {
            if (seatsEl.isJsonArray) {
                for (el in seatsEl.asJsonArray) {
                    val s = el.asString.trim()
                    if (s.isNotEmpty()) list.add(s)
                }
            } else if (seatsEl.isJsonPrimitive) {
                val raw = seatsEl.asString
                // could be ["A1", "A2"] as a string or "A1, A2"
                if (raw.startsWith("[") && raw.endsWith("]")) {
                    val parsed = JsonParser.parseString(raw)
                    if (parsed.isJsonArray) {
                        for (el in parsed.asJsonArray) {
                            list.add(el.asString.trim())
                        }
                    }
                } else {
                    raw.split(",").map { it.trim() }.filter { it.isNotEmpty() }.forEach { list.add(it) }
                }
            }
        } catch (_: Exception) {}
        return list
    }

    private fun parseAttendeeDetail(
        bookingId: String,
        seatKey: String,
        value: com.google.gson.JsonElement,
        eventName: String,
        bookingStatus: String
    ): GlobalAttendee {
        return if (value.isJsonObject) {
            val obj = value.asJsonObject
            GlobalAttendee(
                bookingId = bookingId,
                seatKey = seatKey,
                name = obj.strOrBlank("name").ifBlank { "Guest" },
                seatLabel = seatKey,
                whatsapp = obj.strOrBlank("whatsapp"),
                lunch = obj.strOrBlank("lunch"),
                eventName = eventName,
                checkedIn = obj.boolOrFalse("checkedIn"),
                checkedInAt = if (obj.has("checkedInAt") && !obj.get("checkedInAt").isJsonNull)
                    obj.get("checkedInAt").asString else null,
                bookingStatus = bookingStatus
            )
        } else {
            // String value = just the name
            GlobalAttendee(
                bookingId = bookingId,
                seatKey = seatKey,
                name = value.asString.ifBlank { "Guest" },
                seatLabel = seatKey,
                eventName = eventName,
                checkedIn = false,
                bookingStatus = bookingStatus
            )
        }
    }

    // ── Mark a single attendee as checked-in ──────────────────────────────────

    /**
     * Marks the given seat (seatKey) inside booking [bookingId] as checked-in
     * by PATCHing the attendee_details JSONB column directly via Supabase REST.
     *
     * Returns true on success, false on failure.
     */
    fun markCheckedIn(bookingId: String, seatKey: String): Boolean {
        return try {
            // Step 1: fetch current attendee_details for this booking
            val fetchUrl = "$SUPABASE_URL/rest/v1/bookings" +
                    "?select=attendee_details,status" +
                    "&id=eq.$bookingId"

            val fetchReq = Request.Builder()
                .url(fetchUrl)
                .addSupabaseHeaders()
                .get()
                .build()

            val fetchResp = client.newCall(fetchReq).execute()
            val fetchBody = fetchResp.body?.string() ?: "[]"
            if (!fetchResp.isSuccessful) return false

            val arr = JsonParser.parseString(fetchBody).asJsonArray
            if (arr.size() == 0) return false

            val booking = arr[0].asJsonObject
            val detailsEl = booking.get("attendee_details")
            val details: JsonObject = if (detailsEl != null && !detailsEl.isJsonNull && detailsEl.isJsonObject) {
                detailsEl.asJsonObject
            } else {
                JsonObject()
            }

            // Step 2: update the target seat entry
            val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US)
                .apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
                .format(java.util.Date())

            val seatEntry = if (details.has(seatKey) && details.get(seatKey).isJsonObject) {
                details.getAsJsonObject(seatKey)
            } else {
                // Seat was stored as a plain string (just the name) — preserve the name
                val existingName = if (details.has(seatKey) && details.get(seatKey).isJsonPrimitive)
                    details.get(seatKey).asString.trim() else ""
                JsonObject().also { obj ->
                    if (existingName.isNotBlank()) obj.addProperty("name", existingName)
                }
            }
            seatEntry.addProperty("checkedIn", true)
            seatEntry.addProperty("checkedInAt", now)
            seatEntry.addProperty("checkedInBy", "Gate App")
            details.add(seatKey, seatEntry)

            // Step 3: PATCH the booking row
            val patchUrl = "$SUPABASE_URL/rest/v1/bookings?id=eq.$bookingId"
            val patchBody = JsonObject().apply {
                add("attendee_details", details)
            }

            val patchReq = Request.Builder()
                .url(patchUrl)
                .addSupabaseHeaders()
                .header("Prefer", "return=minimal")
                .patch(gson.toJson(patchBody).toRequestBody(JSON_MEDIA))
                .build()

            val patchResp = client.newCall(patchReq).execute()
            patchResp.isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    // ── JSON helpers ──────────────────────────────────────────────────────────

    private fun JsonObject.strOrBlank(key: String): String {
        return try {
            if (has(key) && !get(key).isJsonNull) get(key).asString.trim() else ""
        } catch (_: Exception) { "" }
    }

    private fun JsonObject.boolOrFalse(key: String): Boolean {
        return try {
            if (has(key) && !get(key).isJsonNull) get(key).asBoolean else false
        } catch (_: Exception) { false }
    }
}
