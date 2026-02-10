#!/bin/bash
# =============================================================================
# Cross-Event Visibility Analysis Script
# =============================================================================
# Shows which pulses have access to an event and which ones have recordings.
#
# Usage:
#   cd services/api
#   bash tests/Manual/analyze_event_visibility.sh [event_id]
#
# =============================================================================

# --- Reference Event IDs (uncomment to use) ---
# EVENT_ID="bb03332f-c91c-4899-a9d8-f8b3be8267f7"  # EXT: Zunou stand up (Dec 17) - 12 instances, 1 recording
# EVENT_ID="e1d3388d-f1d5-4b1e-81fb-b57b06dc9535"  # EXT: Zunou stand up (Aug 18) - 0 instances, 1 recording
# EVENT_ID="9ddbbd8e-ee98-4628-be5d-cf8b73c562a1"  # EXT: Zunou stand up (Sep 8) - 4 recordings (other org)
# EVENT_ID="c559af4f-8f66-44ff-9fc2-c0c44bb7acff"  # testing - single event

# Default event ID (the one with 12 instances and 1 recording)
EVENT_ID="${1:-bb03332f-c91c-4899-a9d8-f8b3be8267f7}"

API_URL="${2:-http://127.0.0.1:8000/graphql}"
TOKEN=$(tail -1 .auth_token 2>/dev/null | tr -d '\n\r')

if [ -z "$TOKEN" ]; then
    echo "Error: No auth token found. Save your token to .auth_token"
    exit 1
fi

echo "=============================================="
echo "Cross-Event Visibility Analysis"
echo "=============================================="
echo "Event ID: $EVENT_ID"
echo ""

# Full query to get all the data we need
QUERY='{
  event(eventId: \"'$EVENT_ID'\") {
    id
    name
    date
    google_event_id
    pulse_id
    pulse { name }
    visibleEventInstances {
      id
      pulse_id
      pulse { id name }
    }
    visibleMeetingSessions {
      id
      status
      pulseId
      event { id pulse_id pulse { name } }
      dataSource { id name origin status }
    }
  }
}'

# Remove newlines for curl
QUERY_ONELINE=$(echo "$QUERY" | tr '\n' ' ' | sed 's/  */ /g')

curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"$QUERY_ONELINE\"}" \
    | python -c "
import sys, json

try:
    data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f'JSON Parse Error: {e}')
    sys.exit(1)

if 'errors' in data:
    print('ERROR:', data['errors'][0]['message'])
    sys.exit(1)

event = data['data']['event']

print('--- Event Info ---')
print(f'  Name: {event[\"name\"]}')
print(f'  Date: {event[\"date\"]}')
print(f'  Google Event ID: {event[\"google_event_id\"]}')
print(f'  Original Pulse: {event.get(\"pulse\", {}).get(\"name\", \"Unknown\")} ({event[\"pulse_id\"][:8]}...)')
print()

# Analyze event instances
instances = event['visibleEventInstances']
print(f'--- Visible Event Instances: {len(instances)} ---')

# Group by pulse
pulse_instances = {}
for inst in instances:
    pid = inst['pulse_id']
    pname = inst.get('pulse', {}).get('name', 'Unknown') if inst.get('pulse') else 'Unknown'
    if pid not in pulse_instances:
        pulse_instances[pid] = {'name': pname, 'count': 0, 'ids': []}
    pulse_instances[pid]['count'] += 1
    pulse_instances[pid]['ids'].append(inst['id'][:8])

print(f'  Unique Pulses: {len(pulse_instances)}')
print()
for pid, info in sorted(pulse_instances.items(), key=lambda x: x[1]['name']):
    print(f'  📁 {info[\"name\"]}')
    print(f'     Pulse ID: {pid}')
    print(f'     Instances: {info[\"count\"]}')
print()

# Analyze meeting sessions
sessions = event['visibleMeetingSessions']
print(f'--- Visible Meeting Sessions (Recordings): {len(sessions)} ---')

if len(sessions) == 0:
    print('  ⚠️  No recordings found')
else:
    # Group by pulse
    pulse_sessions = {}
    for sess in sessions:
        # Get pulse ID and name from the session's linked event
        sess_event = sess.get('event', {}) or {}
        sess_pulse_id = sess.get('pulseId') or sess_event.get('pulse_id')
        
        # Get pulse name from the event's pulse relationship
        if sess_event.get('pulse'):
            pname = sess_event['pulse'].get('name', 'Unknown')
        else:
            pname = 'Unknown'
        
        pid = sess_pulse_id or 'unknown'
        
        ds = sess.get('dataSource', {}) or {}
        origin = ds.get('origin', 'unknown')
        status = ds.get('status', 'unknown')
        name = ds.get('name', 'Unnamed recording')
        
        if pid not in pulse_sessions:
            pulse_sessions[pid] = {'name': pname, 'sessions': []}
        pulse_sessions[pid]['sessions'].append({
            'id': sess['id'],
            'status': sess['status'],
            'origin': origin,
            'ds_status': status,
            'name': name
        })
    
    print(f'  Pulses with recordings: {len(pulse_sessions)}')
    print()
    for pid, info in pulse_sessions.items():
        print(f'  🎥 {info[\"name\"]}')
        print(f'     Pulse ID: {pid}')
        for s in info['sessions']:
            print(f'     └─ {s[\"id\"][:8]}... | {s[\"status\"]} | {s[\"origin\"]} | {s[\"name\"]}')
    print()

# Cross-reference: Which pulses have BOTH instances and recordings?
print('--- Cross-Reference ---')
instance_pulse_ids = set(pulse_instances.keys())
session_pulse_ids = set(pulse_sessions.keys()) if sessions else set()

pulses_with_both = instance_pulse_ids & session_pulse_ids
pulses_instances_only = instance_pulse_ids - session_pulse_ids
pulses_sessions_only = session_pulse_ids - instance_pulse_ids

if pulses_with_both:
    print(f'  ✅ Pulses with BOTH instance + recording: {len(pulses_with_both)}')
    for pid in pulses_with_both:
        name = pulse_instances.get(pid, {}).get('name', pulse_sessions.get(pid, {}).get('name', 'Unknown'))
        print(f'     - {name}')

if pulses_instances_only:
    print(f'  📁 Pulses with instance only (no recording): {len(pulses_instances_only)}')
    for pid in list(pulses_instances_only)[:5]:
        name = pulse_instances.get(pid, {}).get('name', 'Unknown')
        print(f'     - {name}')
    if len(pulses_instances_only) > 5:
        print(f'     ... and {len(pulses_instances_only) - 5} more')

if pulses_sessions_only:
    print(f'  🎥 Pulses with recording but NO instance: {len(pulses_sessions_only)}')
    for pid in pulses_sessions_only:
        name = pulse_sessions.get(pid, {}).get('name', 'Unknown')
        print(f'     - {name} ⚠️')

print()
print('==============================================')"

echo "Done!"
