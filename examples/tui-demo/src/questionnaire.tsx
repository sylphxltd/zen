/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { render } from '@zen/tui';
import {
  Box,
  Button,
  Checkbox,
  FocusProvider,
  SelectInput,
  type SelectOption,
  Text,
  TextInput,
  useFocusManager,
  useInput,
} from '@zen/tui';

// Form state
const name = signal('');
const email = signal('');
const ageRange = signal('');
const occupation = signal('');

// Interests (multiple checkboxes)
const likeProgramming = signal(false);
const likeDesign = signal(false);
const likeWriting = signal(false);
const likeMusic = signal(false);

// Submission state
const submitted = signal(false);
const countdown = signal(5);

// Age range options
const ageRangeOptions: SelectOption[] = [
  { label: 'Under 18', value: 'under-18' },
  { label: '18-24', value: '18-24' },
  { label: '25-34', value: '25-34' },
  { label: '35-44', value: '35-44' },
  { label: '45-54', value: '45-54' },
  { label: '55+', value: '55+' },
];

// Occupation options
const occupationOptions: SelectOption[] = [
  { label: 'Student', value: 'student' },
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Manager', value: 'manager' },
  { label: 'Other', value: 'other' },
];

// Handle submit
function handleSubmit() {
  submitted.value = true;
  countdown.value = 5;

  // Countdown timer
  const interval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(interval);
      process.exit(0);
    }
  }, 1000);
}

// Interests list component
const InterestsList = () => {
  const interests = [];
  if (likeProgramming.value) interests.push('Programming');
  if (likeDesign.value) interests.push('Design');
  if (likeWriting.value) interests.push('Writing');
  if (likeMusic.value) interests.push('Music');

  if (interests.length === 0) {
    return (
      <Text dim style={{ paddingLeft: 2 }}>
        None selected
      </Text>
    );
  }

  return interests.map((interest) => (
    <Text key={interest} style={{ paddingLeft: 2 }}>
      • {interest}
    </Text>
  ));
};

const QuestionnaireForm = () => {
  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      {() => {
        // Reactive: re-renders when submitted changes
        if (submitted.value) {
          return (
            <Box style={{ flexDirection: 'column', gap: 1 }}>
              <Text bold color="green">
                ✓ Thank you for completing the questionnaire!
              </Text>
              <Text dim>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

              <Text bold color="cyan">
                Summary:
              </Text>

              <Box style={{ flexDirection: 'column', paddingLeft: 2 }}>
                <Text>Name: {name.value || '(not provided)'}</Text>
                <Text>Email: {email.value || '(not provided)'}</Text>
                <Text>
                  Age Range:{' '}
                  {ageRangeOptions.find((o) => o.value === ageRange.value)?.label ||
                    '(not selected)'}
                </Text>
                <Text>
                  Occupation:{' '}
                  {occupationOptions.find((o) => o.value === occupation.value)?.label ||
                    '(not selected)'}
                </Text>

                <Text bold style={{ marginTop: 1 }}>
                  Interests:
                </Text>
                <InterestsList />
              </Box>

              <Text dim style={{ marginTop: 2 }}>
                Exiting in {() => countdown.value} seconds...
              </Text>
            </Box>
          );
        }

        // Questionnaire form
        return (
          <Box style={{ flexDirection: 'column', gap: 1 }}>
            <Text bold color="cyan">
              📋 User Questionnaire
            </Text>
            <Text dim>Fill out the form below. Use Tab to navigate, Enter/Space to interact.</Text>
            <Text dim>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

            {/* Name Input */}
            <Box style={{ flexDirection: 'column' }}>
              <Text bold>Name:</Text>
              <TextInput
                id="name"
                value={name}
                placeholder="Enter your name"
                width={50}
                autoFocus
                onChange={(value) => {
                  name.value = value;
                }}
              />
            </Box>

            {/* Email Input */}
            <Box style={{ flexDirection: 'column' }}>
              <Text bold>Email:</Text>
              <TextInput
                id="email"
                value={email}
                placeholder="Enter your email"
                width={50}
                onChange={(value) => {
                  email.value = value;
                }}
              />
            </Box>

            {/* Age Range Select */}
            <Box style={{ flexDirection: 'column' }}>
              <Text bold>Age Range:</Text>
              <SelectInput
                id="age"
                options={ageRangeOptions}
                value={ageRange}
                placeholder="Select your age range"
                width={50}
                onChange={(value) => {
                  ageRange.value = value;
                }}
              />
            </Box>

            {/* Occupation Select */}
            <Box style={{ flexDirection: 'column' }}>
              <Text bold>Occupation:</Text>
              <SelectInput
                id="occupation"
                options={occupationOptions}
                value={occupation}
                placeholder="Select your occupation"
                width={50}
                onChange={(value) => {
                  occupation.value = value;
                }}
              />
            </Box>

            {/* Interests Checkboxes */}
            <Box style={{ flexDirection: 'column' }}>
              <Text bold>Interests (select all that apply):</Text>
              <Box style={{ flexDirection: 'column', paddingLeft: 2, gap: 0 }}>
                <Checkbox
                  id="interest-programming"
                  checked={likeProgramming}
                  label="Programming"
                  onChange={(checked) => {
                    likeProgramming.value = checked;
                  }}
                />
                <Checkbox
                  id="interest-design"
                  checked={likeDesign}
                  label="Design"
                  onChange={(checked) => {
                    likeDesign.value = checked;
                  }}
                />
                <Checkbox
                  id="interest-writing"
                  checked={likeWriting}
                  label="Writing"
                  onChange={(checked) => {
                    likeWriting.value = checked;
                  }}
                />
                <Checkbox
                  id="interest-music"
                  checked={likeMusic}
                  label="Music"
                  onChange={(checked) => {
                    likeMusic.value = checked;
                  }}
                />
              </Box>
            </Box>

            <Text dim>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

            {/* Submit Button */}
            <Button
              id="submit"
              label="Submit"
              onClick={handleSubmit}
              variant="primary"
              width={20}
            />

            <Text dim style={{ marginTop: 1, fontSize: 10 }}>
              Tip: Use Tab/Shift+Tab to navigate between fields
            </Text>
          </Box>
        );
      }}
    </Box>
  );
};

// Render with FocusProvider
// Tab navigation is automatic (handled by FocusProvider)
await render(() => (
  <FocusProvider>
    <QuestionnaireForm />
  </FocusProvider>
));
