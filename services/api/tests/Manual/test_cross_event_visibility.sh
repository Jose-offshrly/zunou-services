#!/bin/bash
# =============================================================================
# Test Script: Cross-Event Meeting Visibility
# =============================================================================
# This script tests the visibleEventInstances and visibleMeetingSessions fields
# that enable users to see recordings from related calendar events.
#
# Prerequisites:
#   - Local API server running: php artisan serve
#   - Auth token saved in .auth_token file
#
# Usage:
#   cd services/api
#   bash tests/Manual/test_cross_event_visibility.sh <event_id>
#
# Example:
#   bash tests/Manual/test_cross_event_visibility.sh bb03332f-c91c-4899-a9d8-f8b3be8267f7
# =============================================================================

set -e

EVENT_ID="${1:-bb03332f-c91c-4899-a9d8-f8b3be8267f7}"
API_URL="${2:-http://127.0.0.1:8000/graphql}"
TOKEN=$(tail -1 .auth_token 2>/dev/null | tr -d '\n\r')

if [ -z "$TOKEN" ]; then
    echo "Error: No auth token found. Save your token to .auth_token"
    exit 1
fi

echo "=============================================="
echo "Testing Cross-Event Visibility"
echo "=============================================="
echo "Event ID: $EVENT_ID"
echo "API URL: $API_URL"
echo ""

# -----------------------------------------------------------------------------
# Test 1: Basic event info with google_event_id
# -----------------------------------------------------------------------------
echo "--- Test 1: Event Info ---"
curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"{ event(eventId: \\\"$EVENT_ID\\\") { id name google_event_id pulse_id organization_id } }\"}" \
    | python -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if 'errors' in d:
        print('ERROR:', d['errors'][0]['message'])
        sys.exit(1)
    e = d['data']['event']
    print(f'  Name: {e[\"name\"]}')
    print(f'  Google Event ID: {e[\"google_event_id\"]}')
    print(f'  Pulse ID: {e[\"pulse_id\"]}')
    print(f'  Org ID: {e[\"organization_id\"]}')
except Exception as ex:
    print('Parse error:', ex)
"
echo ""

# -----------------------------------------------------------------------------
# Test 2: visibleEventInstances (works even without recordings!)
# -----------------------------------------------------------------------------
echo "--- Test 2: Visible Event Instances ---"
echo "(Shows all event instances you can access for this calendar event)"
curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"{ event(eventId: \\\"$EVENT_ID\\\") { visibleEventInstances { id pulse_id pulse { name } } } }\"}" \
    | python -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if 'errors' in d:
        print('ERROR:', d['errors'][0]['message'])
        sys.exit(1)
    instances = d['data']['event']['visibleEventInstances']
    print(f'  Total instances: {len(instances)}')
    pulses = {}
    for i in instances:
        pulse_name = i.get('pulse', {}).get('name', 'Unknown') if i.get('pulse') else 'Unknown'
        pulses[i['pulse_id']] = pulse_name
    print(f'  Unique pulses: {len(pulses)}')
    for pid, pname in list(pulses.items())[:5]:
        print(f'    - {pname} ({pid[:8]}...)')
    if len(pulses) > 5:
        print(f'    ... and {len(pulses) - 5} more')
except Exception as ex:
    print('Parse error:', ex)
"
echo ""

# -----------------------------------------------------------------------------
# Test 3: visibleMeetingSessions (cross-event recordings!)
# -----------------------------------------------------------------------------
echo "--- Test 3: Visible Meeting Sessions ---"
echo "(Shows all recordings you can access across related events)"
curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"{ event(eventId: \\\"$EVENT_ID\\\") { visibleMeetingSessions { id status event { id name pulse_id } dataSource { id name origin } } } }\"}" \
    | python -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if 'errors' in d:
        print('ERROR:', d['errors'][0]['message'])
        sys.exit(1)
    sessions = d['data']['event']['visibleMeetingSessions']
    print(f'  Total recordings: {len(sessions)}')
    for s in sessions:
        status = s['status']
        origin = s.get('dataSource', {}).get('origin', 'unknown') if s.get('dataSource') else 'unknown'
        event_name = s.get('event', {}).get('name', 'Unknown') if s.get('event') else 'Unknown'
        print(f'    - {s[\"id\"][:8]}... ({status}, {origin})')
        print(f'      From event: {event_name}')
except Exception as ex:
    print('Parse error:', ex)
"
echo ""

# -----------------------------------------------------------------------------
# Test 4: Combined summary
# -----------------------------------------------------------------------------
echo "--- Test 4: Summary ---"
curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"{ event(eventId: \\\"$EVENT_ID\\\") { name visibleEventInstances { id } visibleMeetingSessions { id } } }\"}" \
    | python -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if 'errors' in d:
        print('ERROR:', d['errors'][0]['message'])
        sys.exit(1)
    e = d['data']['event']
    instances = len(e['visibleEventInstances'])
    sessions = len(e['visibleMeetingSessions'])
    print(f'  Event: {e[\"name\"]}')
    print(f'  Visible Event Instances: {instances}')
    print(f'  Visible Meeting Sessions: {sessions}')
    if sessions > 0:
        print('  ✅ Cross-event recording visibility working!')
    else:
        print('  ℹ️  No recordings found (but instances are visible)')
except Exception as ex:
    print('Parse error:', ex)
"
echo ""
echo "=============================================="
echo "Done!"
