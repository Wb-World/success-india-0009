
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
 * Generates row labels: A-Z, then AA, BB, CC...
 * Support at least 100 rows.
 */
export function getRowLabel(index: number): string {
  const charCode = index % 26;
  const repeatCount = Math.floor(index / 26) + 1;
  return String.fromCharCode(65 + charCode).repeat(repeatCount);
}

/**
 * Resolves the 0-based row index for a given row label (A->0, AA->26, AAA->52, etc.)
 */
export function getRowIndex(rowLabel: string): number {
  if (!/^[A-Z]+$/.test(rowLabel)) return -1;
  const char = rowLabel[0];
  // Verify all characters are identical (like AA, BBB)
  for (let i = 1; i < rowLabel.length; i++) {
    if (rowLabel[i] !== char) return -1;
  }
  const charIndex = char.charCodeAt(0) - 65; // 0 to 25
  const repeatCount = rowLabel.length; // 1, 2, 3...
  return charIndex + (repeatCount - 1) * 26;
}

/**
 * Validates whether a seat ID is valid within the specified bounds
 */
export function isSeatValid(seatCode: string, seatsPerRow: number, totalRows: number): boolean {
  const match = seatCode.match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return false;
  const rowLabel = match[1];
  const seatNum = parseInt(match[2], 10);

  if (seatNum < 1 || seatNum > seatsPerRow) return false;

  const rowIndex = getRowIndex(rowLabel);
  if (rowIndex === -1 || rowIndex >= totalRows) return false;

  return true;
}

/**
 * Dynamically computes rows, seats per row, all seats list, and total seats count based on event config
 */
export function getEventSeatLayout(event: { seatsPerRow?: number; totalRows?: number; seats_per_row?: number; total_rows?: number } | null | undefined) {
  const seatsPerRow = Number(event?.seatsPerRow ?? event?.seats_per_row ?? SEATS_PER_ROW);
  const totalRows = Number(event?.totalRows ?? event?.total_rows ?? ROWS.length);

  const rows: string[] = [];
  for (let i = 0; i < totalRows; i++) {
    rows.push(getRowLabel(i));
  }

  const allSeats = rows.flatMap((row) =>
    Array.from({ length: seatsPerRow }, (_, i) => `${row}${i + 1}`)
  );

  return {
    rows,
    seatsPerRow,
    totalSeats: totalRows * seatsPerRow,
    allSeats
  };
}

/**
 * Parses bulk action input string. Supports comma-separated individual seats and '-' range syntax.
 * Returns an object with:
 * - seats: string[] (valid unique seats generated)
 * - errors: string[] (validation errors for skipped invalid inputs)
 */
export function parseBulkSeats(
  input: string,
  customAllSeats?: string[],
  customRows?: string[]
): { seats: string[]; errors: string[] } {
  const seatsList = customAllSeats || ALL_SEATS;
  const rowsList = customRows || ROWS;
  const seatsSet = new Set<string>();
  const errors: string[] = [];

  if (!input || !input.trim()) {
    return { seats: [], errors: [] };
  }

  // Helper to validate individual seat
  const isValidSeat = (seat: string): boolean => {
    return seatsList.includes(seat);
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
        const startRowIdx = rowsList.indexOf(startRow);
        const endRowIdx = rowsList.indexOf(endRow);

        if (startRowIdx === -1 || endRowIdx === -1) {
          errors.push(`Invalid row in range: ${cleanedToken}`);
          continue;
        }

        const minRowIdx = Math.min(startRowIdx, endRowIdx);
        const maxRowIdx = Math.max(startRowIdx, endRowIdx);

        for (let r = minRowIdx; r <= maxRowIdx; r++) {
          const seatId = `${rowsList[r]}${startNum}`;
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
