
export const ROWS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O'
];

export const SEATS_PER_ROW = 20;

export const ALL_SEATS: string[] = ROWS.flatMap((row) =>
  Array.from({ length: SEATS_PER_ROW }, (_, i) => `${row}${i + 1}`)
);

export const TOTAL_SEATS = ROWS.length * SEATS_PER_ROW;

/**
 * Parses bulk action input string. Supports comma-separated individual seats and '-' range syntax.
 * Returns an object with:
 * - seats: string[] (valid unique seats generated)
 * - errors: string[] (validation errors for skipped invalid inputs)
 */
export function parseBulkSeats(input: string): { seats: string[]; errors: string[] } {
  const seatsSet = new Set<string>();
  const errors: string[] = [];

  if (!input || !input.trim()) {
    return { seats: [], errors: [] };
  }

  // Helper to validate individual seat
  const isValidSeat = (seat: string): boolean => {
    return ALL_SEATS.includes(seat);
  };

  // Helper to parse a single seat code into row and number
  const parseSeatCode = (code: string): { row: string; num: number } | null => {
    const match = code.match(/^([A-Z]+)([0-9]+)$/);
    if (!match) return null;
    return {
      row: match[1],
      num: parseInt(match[2], 10)
    };
  };

  const tokens = input.split(',');

  for (const token of tokens) {
    const cleanedToken = token.trim().toUpperCase();
    if (!cleanedToken) continue;

    if (!cleanedToken.includes('-')) {
      // Individual seat
      if (isValidSeat(cleanedToken)) {
        seatsSet.add(cleanedToken);
      } else {
        errors.push(`Seat does not exist: ${cleanedToken}`);
      }
    } else {
      // Seat range
      const rangeParts = cleanedToken.split('-');
      if (rangeParts.length !== 2) {
        errors.push(`Invalid range format: ${cleanedToken}`);
        continue;
      }

      const start = rangeParts[0].trim();
      const end = rangeParts[1].trim();

      const startParsed = parseSeatCode(start);
      const endParsed = parseSeatCode(end);

      if (!startParsed || !endParsed) {
        errors.push(`Invalid seat code in range: ${cleanedToken}`);
        continue;
      }

      const { row: startRow, num: startNum } = startParsed;
      const { row: endRow, num: endNum } = endParsed;

      // Validate endpoints exist in layout
      if (!isValidSeat(start)) {
        errors.push(`Start seat of range does not exist: ${start}`);
        continue;
      }
      if (!isValidSeat(end)) {
        errors.push(`End seat of range does not exist: ${end}`);
        continue;
      }

      if (startRow === endRow) {
        // Same row range (e.g., A5-A20)
        const minNum = Math.min(startNum, endNum);
        const maxNum = Math.max(startNum, endNum);
        for (let n = minNum; n <= maxNum; n++) {
          const seatId = `${startRow}${n}`;
          if (isValidSeat(seatId)) {
            seatsSet.add(seatId);
          } else {
            errors.push(`Generated seat does not exist: ${seatId}`);
          }
        }
      } else if (startNum === endNum) {
        // Same number range across rows (e.g., B3-D3)
        const startRowIdx = ROWS.indexOf(startRow);
        const endRowIdx = ROWS.indexOf(endRow);

        if (startRowIdx === -1 || endRowIdx === -1) {
          errors.push(`Invalid row in range: ${cleanedToken}`);
          continue;
        }

        const minRowIdx = Math.min(startRowIdx, endRowIdx);
        const maxRowIdx = Math.max(startRowIdx, endRowIdx);

        for (let r = minRowIdx; r <= maxRowIdx; r++) {
          const seatId = `${ROWS[r]}${startNum}`;
          if (isValidSeat(seatId)) {
            seatsSet.add(seatId);
          } else {
            errors.push(`Generated seat does not exist: ${seatId}`);
          }
        }
      } else {
        errors.push(`Unsupported range (must be same row or same seat number): ${cleanedToken}`);
      }
    }
  }

  return {
    seats: Array.from(seatsSet),
    errors
  };
}
