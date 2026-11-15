import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVoiceNoteTrigger,
  createVoiceNote,
  VoiceNote,
} from './voiceNotes';

test('parseVoiceNoteTrigger detects various voice commands accurately', () => {
  const t1 = parseVoiceNoteTrigger('Take a note check tire pressure at next bunk');
  assert.equal(t1.isVoiceNoteTrigger, true);
  assert.equal(t1.noteContent, 'check tire pressure at next bunk');

  const t2 = parseVoiceNoteTrigger('Remember this call brother about arrival time');
  assert.equal(t2.isVoiceNoteTrigger, true);
  assert.equal(t2.noteContent, 'call brother about arrival time');

  const t3 = parseVoiceNoteTrigger('Quick note: check engine oil level');
  assert.equal(t3.isVoiceNoteTrigger, true);
  assert.equal(t3.noteContent, 'check engine oil level');

  const t4 = parseVoiceNoteTrigger('Navigate to Madurai');
  assert.equal(t4.isVoiceNoteTrigger, false);
  assert.equal(t4.noteContent, '');
});

test('createVoiceNote smartly categorizes tags according to keywords', () => {
  const maintenanceNote = createVoiceNote('Need to replace front brake pads and check tire pressure');
  assert.equal(maintenanceNote.tag, 'Car Maintenance');

  const fuelNote = createVoiceNote('Spent 1500 rupees at Indian Oil fuel bunk');
  assert.equal(fuelNote.tag, 'Fuel / Expense');

  const reminderNote = createVoiceNote('Remember to call hotel reception before 9 PM');
  assert.equal(reminderNote.tag, 'Reminder');

  const memoryNote = createVoiceNote('Such a scenic sunset view along Western Ghats highway');
  assert.equal(memoryNote.tag, 'Trip Memory');
});
