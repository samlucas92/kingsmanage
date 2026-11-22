/**
 * KingsManage match-stat webhook for Google Sheets.
 *
 * Expected sheet layout:
 *   row 3: match date (merged across the App / Goals pair)
 *   row 4: opponent (merged across the pair)
 *   row 5: home score / away score
 *   row 6: App / Goals
 *   column A: squad number
 *   column B: player name
 *   row 7 onwards: players
 *
 * Required Script Properties:
 *   EXPORT_SECRET  - a long random value also configured on the KingsManage API
 *   TEAM_SHEET_MAP - JSON mapping KingsManage team IDs to sheet tab names
 */

const KINGS_MANAGE_CONFIG = Object.freeze({
  DATE_ROW: 3,
  OPPONENT_ROW: 4,
  SCORE_ROW: 5,
  STAT_HEADER_ROW: 6,
  FIRST_PLAYER_ROW: 7,
  PLAYER_NUMBER_COLUMN: 1,
  PLAYER_NAME_COLUMN: 2,
  FIRST_MATCH_COLUMN: 3,
  MATCH_NOTE_PREFIX: 'kingsmanage-match:',
});

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    const payload = parsePayload_(event);
    validateSecret_(payload.secret);
    validatePayload_(payload);

    lock.waitLock(20000);
    const result = exportMatch_(payload);
    SpreadsheetApp.flush();

    return jsonResponse_(Object.assign({ ok: true }, result));
  } catch (error) {
    console.error(error);
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'KingsManage Google Sheets export',
  });
}

function exportMatch_(payload) {
  const sheet = resolveTeamSheet_(payload.teamId, payload.teamName);
  const matchColumn = findExistingMatchColumn_(sheet, payload.matchId);
  const isUpdate = matchColumn !== null;
  const targetColumn = isUpdate ? matchColumn : prepareNewMatchColumns_(sheet);
  const playerRows = getPlayerRows_(sheet);
  const matches = matchPlayers_(playerRows, payload.players);

  if (matches.unmatchedParticipants.length > 0) {
    throw new Error(
      'These players appeared in the match but were not found in column B: ' +
      matches.unmatchedParticipants.join(', ') +
      '. Add or correct those player rows, then export again.'
    );
  }

  writeMatchHeaders_(sheet, targetColumn, payload);
  writePlayerStats_(sheet, targetColumn, matches.rows);

  return {
    action: isUpdate ? 'updated' : 'created',
    sheetName: sheet.getName(),
    matchColumn: targetColumn,
    matchedPlayers: matches.rows.length,
    unmatchedPlayers: [],
  };
}

function parsePayload_(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error('The request did not contain a JSON body.');
  }

  try {
    return JSON.parse(event.postData.contents);
  } catch (error) {
    throw new Error('The request body was not valid JSON.');
  }
}

function validateSecret_(suppliedSecret) {
  const expectedSecret = PropertiesService.getScriptProperties()
    .getProperty('EXPORT_SECRET');

  if (!expectedSecret) {
    throw new Error('EXPORT_SECRET is not configured in Apps Script properties.');
  }

  if (!suppliedSecret || suppliedSecret !== expectedSecret) {
    throw new Error('The export secret is invalid.');
  }
}

function validatePayload_(payload) {
  if (!payload || payload.schemaVersion !== 1) {
    throw new Error('Unsupported or missing schemaVersion.');
  }

  if (!payload.matchId || !payload.teamId || !payload.date || !payload.opponent) {
    throw new Error('matchId, teamId, date and opponent are required.');
  }

  if (!Array.isArray(payload.players)) {
    throw new Error('players must be an array.');
  }

  if (!Number.isFinite(Number(payload.homeGoals)) ||
      !Number.isFinite(Number(payload.awayGoals))) {
    throw new Error('The final score is invalid.');
  }
}

function resolveTeamSheet_(teamId, teamName) {
  const rawMap = PropertiesService.getScriptProperties()
    .getProperty('TEAM_SHEET_MAP');

  if (!rawMap) {
    throw new Error('TEAM_SHEET_MAP is not configured in Apps Script properties.');
  }

  let teamMap;
  try {
    teamMap = JSON.parse(rawMap);
  } catch (error) {
    throw new Error('TEAM_SHEET_MAP is not valid JSON.');
  }

  const sheetName = teamMap[teamId] || teamMap[teamName];
  if (!sheetName) {
    throw new Error(
      'No TEAM_SHEET_MAP entry exists for team ' + teamName + ' (' + teamId + ').'
    );
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('The mapped sheet tab does not exist: ' + sheetName + '.');
  }

  return sheet;
}

function findExistingMatchColumn_(sheet, matchId) {
  const expectedNote = KINGS_MANAGE_CONFIG.MATCH_NOTE_PREFIX + matchId;
  const lastColumn = Math.max(sheet.getLastColumn(), KINGS_MANAGE_CONFIG.FIRST_MATCH_COLUMN);

  for (let column = KINGS_MANAGE_CONFIG.FIRST_MATCH_COLUMN; column <= lastColumn; column += 1) {
    const note = sheet.getRange(KINGS_MANAGE_CONFIG.DATE_ROW, column).getNote();
    if (note === expectedNote) {
      return column;
    }
  }

  return null;
}

function prepareNewMatchColumns_(sheet) {
	const availableColumn = findAvailableMatchColumn_(sheet);
	if (availableColumn !== null) {
		return availableColumn;
	}

  const lastMatchGoalColumn = findLastMatchGoalColumn_(sheet);
  const targetColumn = lastMatchGoalColumn > 0
    ? lastMatchGoalColumn + 1
    : KINGS_MANAGE_CONFIG.FIRST_MATCH_COLUMN;

  ensureColumnsExist_(sheet, targetColumn + 1);

  if (rangeHasValues_(sheet, targetColumn, 2)) {
    sheet.insertColumnsBefore(targetColumn, 2);
  }

  if (lastMatchGoalColumn > 0) {
    const sourceColumn = lastMatchGoalColumn - 1;
    const source = sheet.getRange(
      1,
      sourceColumn,
      Math.max(sheet.getLastRow(), KINGS_MANAGE_CONFIG.FIRST_PLAYER_ROW),
      2
    );
    const target = sheet.getRange(1, targetColumn, source.getNumRows(), 2);
    source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    sheet.setColumnWidth(targetColumn, sheet.getColumnWidth(sourceColumn));
    sheet.setColumnWidth(targetColumn + 1, sheet.getColumnWidth(sourceColumn + 1));
  }

  return targetColumn;
}

function findAvailableMatchColumn_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < KINGS_MANAGE_CONFIG.FIRST_MATCH_COLUMN + 1) {
    return null;
  }

  for (let column = KINGS_MANAGE_CONFIG.FIRST_MATCH_COLUMN; column < lastColumn; column += 1) {
    const headers = sheet.getRange(
      KINGS_MANAGE_CONFIG.STAT_HEADER_ROW,
      column,
      1,
      2
    ).getDisplayValues()[0];
    const hasStatHeaders = String(headers[0]).trim().toLowerCase() === 'app' &&
      String(headers[1]).trim().toLowerCase() === 'goals';
    const date = sheet.getRange(KINGS_MANAGE_CONFIG.DATE_ROW, column).getDisplayValue();
    const opponent = sheet.getRange(KINGS_MANAGE_CONFIG.OPPONENT_ROW, column).getDisplayValue();
    const note = sheet.getRange(KINGS_MANAGE_CONFIG.DATE_ROW, column).getNote();

    if (hasStatHeaders && !date && !opponent && !note) {
      return column;
    }
  }

  return null;
}

function findLastMatchGoalColumn_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < KINGS_MANAGE_CONFIG.FIRST_MATCH_COLUMN + 1) {
    return 0;
  }

  const headers = sheet.getRange(
    KINGS_MANAGE_CONFIG.STAT_HEADER_ROW,
    KINGS_MANAGE_CONFIG.FIRST_MATCH_COLUMN,
    1,
    lastColumn - KINGS_MANAGE_CONFIG.FIRST_MATCH_COLUMN + 1
  ).getDisplayValues()[0];

  let lastGoalColumn = 0;
  for (let index = 0; index < headers.length - 1; index += 1) {
    const current = String(headers[index]).trim().toLowerCase();
    const next = String(headers[index + 1]).trim().toLowerCase();

    if (current === 'app' && next === 'goals') {
      lastGoalColumn = KINGS_MANAGE_CONFIG.FIRST_MATCH_COLUMN + index + 1;
    }
  }

  return lastGoalColumn;
}

function ensureColumnsExist_(sheet, requiredLastColumn) {
  const missingColumns = requiredLastColumn - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }
}

function rangeHasValues_(sheet, startColumn, width) {
  return sheet.getRange(
    KINGS_MANAGE_CONFIG.DATE_ROW,
    startColumn,
    KINGS_MANAGE_CONFIG.STAT_HEADER_ROW - KINGS_MANAGE_CONFIG.DATE_ROW + 1,
    width
  ).getDisplayValues().some(function (row) {
    return row.some(function (value) { return String(value).trim() !== ''; });
  });
}

function getPlayerRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < KINGS_MANAGE_CONFIG.FIRST_PLAYER_ROW) {
    return [];
  }

  const values = sheet.getRange(
    KINGS_MANAGE_CONFIG.FIRST_PLAYER_ROW,
    KINGS_MANAGE_CONFIG.PLAYER_NUMBER_COLUMN,
    lastRow - KINGS_MANAGE_CONFIG.FIRST_PLAYER_ROW + 1,
    2
  ).getDisplayValues();

  return values
    .map(function (row, index) {
      return {
        rowNumber: KINGS_MANAGE_CONFIG.FIRST_PLAYER_ROW + index,
        number: parsePlayerNumber_(row[0]),
        name: String(row[1]).trim(),
        normalizedName: normalizeName_(row[1]),
      };
    })
    .filter(function (row) { return row.normalizedName !== ''; });
}

function matchPlayers_(sheetRows, players) {
  const playersByName = groupBy_(players, function (player) {
    return normalizeName_(player.name);
  });
  const playersByNumber = groupBy_(
    players.filter(function (player) { return Number(player.number) > 0; }),
    function (player) { return String(Number(player.number)); }
  );
  const matchedPlayerIds = {};
  const rows = [];

  sheetRows.forEach(function (sheetRow) {
    let player = uniqueValue_(playersByName[sheetRow.normalizedName]);

    if (!player && sheetRow.number > 0) {
      player = uniqueValue_(playersByNumber[String(sheetRow.number)]);
    }

    if (!player || matchedPlayerIds[player.playerId]) {
      return;
    }

    matchedPlayerIds[player.playerId] = true;
    rows.push({ rowNumber: sheetRow.rowNumber, player: player });
  });

  const unmatchedParticipants = players
    .filter(function (player) {
      return player.appearance === 1 && !matchedPlayerIds[player.playerId];
    })
    .map(function (player) { return player.name; });

  return { rows: rows, unmatchedParticipants: unmatchedParticipants };
}

function groupBy_(values, getKey) {
  return values.reduce(function (result, value) {
    const key = getKey(value);
    if (!key) {
      return result;
    }
    result[key] = result[key] || [];
    result[key].push(value);
    return result;
  }, {});
}

function uniqueValue_(values) {
  return values && values.length === 1 ? values[0] : null;
}

function parsePlayerNumber_(value) {
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeName_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function writeMatchHeaders_(sheet, column, payload) {
  const dateRange = sheet.getRange(KINGS_MANAGE_CONFIG.DATE_ROW, column, 1, 2);
  const opponentRange = sheet.getRange(KINGS_MANAGE_CONFIG.OPPONENT_ROW, column, 1, 2);

  dateRange.breakApart();
  opponentRange.breakApart();
  dateRange.clearContent().merge();
  opponentRange.clearContent().merge();

  const matchDate = new Date(payload.date);
  if (Number.isNaN(matchDate.getTime())) {
    throw new Error('The match date is invalid.');
  }

  dateRange
    .setValue(matchDate)
    .setNumberFormat('dd/MM/yyyy')
    .setHorizontalAlignment('center')
    .setNote(KINGS_MANAGE_CONFIG.MATCH_NOTE_PREFIX + payload.matchId);
  opponentRange
    .setValue(payload.opponent)
    .setHorizontalAlignment('center');
  sheet.getRange(KINGS_MANAGE_CONFIG.SCORE_ROW, column, 1, 2)
    .setValues([[Number(payload.homeGoals), Number(payload.awayGoals)]]);
  sheet.getRange(KINGS_MANAGE_CONFIG.STAT_HEADER_ROW, column, 1, 2)
    .setValues([['App', 'Goals']]);
}

function writePlayerStats_(sheet, column, matchedRows) {
  matchedRows.forEach(function (match) {
    const player = match.player;
    sheet.getRange(match.rowNumber, column, 1, 2).setValues([[
      player.appearance === 1 ? 1 : '',
      player.appearance === 1 ? Math.max(Number(player.goals) || 0, 0) : '',
    ]]);
  });
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
