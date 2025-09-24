# Pomodoro Kanban Plugin

Create markdown-backed Kanban boards in [Obsidian](https://obsidian.md/) with integrated Pomodoro timer functionality.

## Features

### Kanban Board Management
- Create and manage markdown-backed Kanban boards
- Drag and drop cards between lanes
- Archive completed cards
- Search and filter functionality

### Pomodoro Timer Integration
- **Pomodoro Timer**: 25-minute focused work sessions (configurable)
- **Stopwatch**: Free-form timing for flexible work sessions
- **Break Timer**: Automatic short (5min) and long (15min) breaks
- **Auto Pomodoro Rounds**: Set automatic pomodoro rounds that continue after breaks (configurable)
- **Quick Stop**: If you stop a timer within 1 minute, it won't ask for a reason and won't be logged
- **Time Logging**: Automatic logging of work sessions to card markdown
- **Interrupt Tracking**: Track why you stopped a session (for sessions longer than 1 minute)
- **Sound Notifications**: Audio alerts when sessions complete
- **Customizable Settings**: Configure timer durations, interrupt reasons, and sound preferences
- **Timelog Display Control**: Option to hide timelog entries in card view while keeping them visible in markdown view
- **Due Date Management**: Set due dates for tasks with visual indicators (red, bold text) displayed on the right side of the focused time line

## Auto Pomodoro Rounds Feature

The plugin now supports automatic pomodoro rounds, allowing you to set a number of consecutive pomodoro sessions that will automatically start after each break ends.

### How It Works

1. **Set Auto Rounds**: In the Timer Settings, configure "Auto pomodoro rounds" to a number greater than 0 (0 = disabled)
2. **Start First Pomodoro**: Begin your first pomodoro session manually
3. **Automatic Continuation**: After each pomodoro completes and break ends, the next pomodoro will automatically start
4. **Round Tracking**: The system tracks your progress and shows notifications like "Auto-starting round 2/4"
5. **Completion**: When all rounds are completed, you'll see "Completed X automatic pomodoro rounds!"

### Settings

- **Auto pomodoro rounds**: Set to 0 to disable, or any positive number to enable automatic rounds
- **Global and Local**: This setting works both globally (for all boards) and locally (per board)
- **Reset Behavior**: The auto round counter resets when you manually start a new pomodoro or reset the timer

### Example Usage

- Set "Auto pomodoro rounds" to 4
- Start your first pomodoro manually
- After 25 minutes, break starts automatically
- After 5 minutes, second pomodoro starts automatically
- This continues until all 4 rounds are completed
- Perfect for focused work sessions without manual intervention

## Break Time Logic Analysis & Optimization

### Current Break Time Implementation

The current break time logic follows a simple but effective pattern:

1. **Automatic Trigger**: Break timer starts automatically when a Pomodoro session completes
2. **Duration Management**: 
   - Short breaks: 5 minutes (configurable)
   - Long breaks: 15 minutes (configurable) 
   - Long break interval: Every 4 Pomodoros
3. **Auto-completion**: Break timer automatically stops when duration is reached, plays notification sound, and shows "Break over!" message

### Identified Areas for Improvement

#### 1. User Experience Issues
- **Lack of Flexibility**: Users cannot choose whether to take a break or skip it
- **No Manual Control**: Cannot manually start a break timer
- **Limited Personalization**: All breaks use the same duration settings regardless of context

#### 2. Missing Features
- **No Break Statistics**: No tracking or analysis of break patterns
- **Limited Break Management**: Cannot pause/resume or extend break time
- **No Activity Suggestions**: No guidance on what to do during breaks

### Proposed Optimizations

#### 1. Smart Break Prompts
- Show break options before auto-starting (Start Break / Skip / Postpone)
- Allow users to choose break type (micro/short/long)
- Provide break activity suggestions based on time of day and context

#### 2. Enhanced Break Management
- Add break statistics and analytics
- Implement adaptive break duration based on work intensity
- Support break activity tracking and effectiveness scoring

#### 3. Progressive Reminders
- Gentle reminders during break (halfway point, 2 minutes left, etc.)
- Break preparation notifications
- Customizable break activity recommendations

#### 4. Break Dashboard
- Visual break progress indicator
- Break history and trends
- Personalized break recommendations
- Integration with work session data

### Implementation Priority

**Phase 1 (High Priority)**:
- Add break skip/postpone options
- Implement break statistics tracking
- Add break activity suggestions

**Phase 2 (Medium Priority)**:
- Adaptive break duration calculation
- Progressive reminder system
- Break effectiveness scoring

**Phase 3 (Future Enhancement)**:
- Advanced break analytics
- Integration with external health apps
- AI-powered break recommendations

### Timer Behavior
- **1-Minute Rule**: If you stop a timer within the first minute, it stops immediately without asking for a reason and doesn't create a log entry
- **Session Logging**: All sessions longer than 1 minute are automatically logged to the card's markdown
- **Interrupt Reasons**: For longer sessions, you can specify why you stopped (interruption, task complete, etc.)
- **Card Switching**: Switch between cards while maintaining timer state

## Due Date Management

The plugin now includes comprehensive due date functionality to help you track task deadlines:

### Features
- **Easy Due Date Setting**: Access due date picker through the timer menu (right-click on timer button)
- **Single Due Date Per Card**: Each card can only have one due date - existing due dates are replaced when setting a new one
- **Visual Indicators**: Due dates are displayed in red, bold text on the right side of the focused time line
- **Flexible Format**: Supports both regular date format and daily note linking
- **Click to Edit**: Click on any due date to modify or remove it
- **Markdown Integration**: Due dates are stored as `due:@2024-01-15` format in the card markdown

### How to Use
1. **Set Due Date**: Right-click on the timer button of any card and select "添加截止日期" (Add Due Date) or "更改截止日期" (Change Due Date) if one already exists
2. **Smart Menu**: The menu automatically detects if a card already has a due date and shows the appropriate option:
   - "添加截止日期" (Add Due Date) - when no due date exists
   - "更改截止日期" (Change Due Date) - when a due date already exists
3. **Date Picker**: Choose your desired due date from the calendar popup
4. **Time Picker**: After selecting the date, a time picker will automatically appear to set the specific time
5. **Visual Display**: The due date and time will appear in red, bold text on the right side of the focused time line
6. **Edit Due Date**: Click on the displayed due date to modify both date and time
7. **Replace Due Date**: Setting a new due date will automatically replace any existing due date and time
8. **Remove Due Date**: Use the date picker to clear the due date

### Markdown Format
Due dates and times are stored in the card's markdown content using the format:
- `due:@2024-01-15` for dates only
- `due:@2024-01-15 due:@14:30` for dates with specific times
- `due:@[[2024-01-15]]` for daily note links (if enabled in settings)

**Note**: While due dates are stored in the markdown content for data persistence, they are no longer displayed in the card's content area. Instead, they appear exclusively in the focused time line for better visual organization.

## Timelog Display Control

The plugin provides flexible control over how timelog entries are displayed:

### Settings
- **Show timelog**: Controls whether timelog entries are displayed at all (global setting)
- **Hide timelog in cards**: When enabled, timelog entries are hidden in card view but remain visible in markdown view

### Use Cases
- **Clean Card View**: Hide timelog entries in the Kanban board for a cleaner, less cluttered interface
- **Preserve Data**: Timelog data remains intact in the markdown source and is visible when viewing the file as markdown
- **Flexible Workflow**: Switch between detailed and minimal views based on your current needs

### How It Works
1. Timelog entries are always recorded to the markdown file when timer sessions complete
2. The "Show timelog" setting controls the base visibility of timelog entries
3. The "Hide timelog in cards" setting provides an additional layer of control specifically for card view
4. When both settings are configured, timelog entries will only be hidden in card view if both conditions are met

## Recent Improvements

### Due Date Duplication Fix
- **Prevented Duplicate Due Dates**: Fixed an issue where users could accidentally add multiple due dates to the same card
- **Smart Replacement Logic**: When setting a new due date, all existing due dates are automatically removed to prevent duplicates
- **Improved Parsing**: The parser now correctly handles multiple due dates by keeping only the most recent one
- **Clean Markdown**: Ensures clean markdown output without duplicate due date entries
- **Enhanced Menu Detection**: Fixed menu detection logic to reliably show "更改截止日期" (Change Due Date) when a due date already exists, preventing confusion about whether a due date is already set

### Smart Due Date Menu
- **Intelligent Menu Detection**: The timer menu now automatically detects whether a card already has a due date and displays the appropriate menu option:
  - Shows "添加截止日期" (Add Due Date) when no due date exists
  - Shows "更改截止日期" (Change Due Date) when a due date already exists
- **Improved User Experience**: Users can now clearly understand whether they are adding a new due date or modifying an existing one
- **Consistent Detection Logic**: Uses the same detection logic as the due date display component for accurate status detection

### Timer Settings Priority Fix
- **Local Settings Priority**: Fixed an issue where board-specific timer settings (pomodoro rounds, break time duration) were not being properly applied. Local board settings now correctly take precedence over global settings for all timer-related configurations including:
  - Pomodoro duration
  - Short break duration  
  - Long break duration
  - Long break interval
  - Auto pomodoro rounds
- **Real-time Settings Updates**: Timer settings now update immediately when changed in board settings, without requiring a restart.

### UI Consistency Fixes
- **Button Size Consistency**: Fixed timer button and menu button size inconsistency on hover. Both buttons now maintain the same size when hovered, providing a more consistent user experience.

### Due Date Display Optimization
- **Improved Due Date Positioning**: Due dates are now displayed exclusively on the right side of the focused time line, completely removed from markdown content display
- **Cleaner Card Layout**: This change eliminates due date duplication and creates a more streamlined card appearance
- **Better Information Hierarchy**: Due dates are now grouped with timing information, making it easier to see both focused time and deadlines at a glance
- **Markdown Content Cleanup**: Due date information is no longer displayed in the card's markdown content, keeping the content area clean and focused on the actual task description
- **Independent Display Logic**: Due dates in the focused time line are now independent of the "move-dates" setting, ensuring they always display when present

### Debug Information for Due Date Issues
- **Comprehensive Debug Logging**: Added detailed console logging throughout the due date processing pipeline to help diagnose display issues
- **DueDate Component Debug**: Logs due date data, formatting settings, and rendering decisions
- **Item Component Debug**: Logs focused time line rendering logic and due date display conditions
- **Parser Debug**: Logs markdown parsing process for due date extensions and AST generation
- **Hydration Debug**: Logs due date string parsing and moment.js conversion process
- **List Processing Debug**: Logs due date extraction from AST nodes to item metadata
- **Debug Usage**: Open browser developer console to view detailed debug information when due dates are not displaying correctly
- **Debug Guide**: See `DEBUG_DUEDATE.md` for detailed instructions on how to use the debug information to troubleshoot due date display issues

### Due Date Data Flow Fix
- **Fixed Data Mapping Issue**: Resolved issue where duedate data was not being properly mapped from AST nodes to item metadata
- **Compatibility Layer**: Added compatibility mapping to store duedate data in both `node.duedate` and `node.date` properties
- **Enhanced Debug Logging**: Added detailed logging in list processing to track data extraction from AST nodes
- **Root Cause**: The issue was that duedate data was stored in `node.duedate` during parsing but the list processor expected it in `node.date` (DateNode interface)

### Due Time Data Flow Fix
- **Fixed Due Time Mapping Issue**: Resolved the same data mapping issue for duetime that was affecting duedate
- **Compatibility Layer**: Added compatibility mapping to store duetime data in both `node.duetime` and `node.time` properties
- **Complete Due Date/Time Support**: Both due date and due time now display correctly in the focused time line
- **Consistent Data Flow**: Due time follows the same data flow pattern as due date for reliable processing

### Due Date Display Format Enhancement
- **Enhanced Visual Format**: Due dates now display with "! Due: " prefix for better visibility and urgency indication
- **Improved Spacing**: Added right padding (8px) to due date display for better visual separation
- **Clear Identification**: The exclamation mark and "Due:" label make due dates easily distinguishable from other metadata
- **Consistent Styling**: Maintains red color and bold font weight for high visibility

- [Bugs, Issues, & Feature Requests](https://github.com/mgmeyers/obsidian-kanban/issues)
- [Development Roadmap](https://github.com/mgmeyers/obsidian-kanban/projects/1)

![Screen Shot 2021-09-16 at 12.58.22 PM.png](https://github.com/mgmeyers/obsidian-kanban/blob/main/docs/Assets/Screen%20Shot%202021-09-16%20at%2012.58.22%20PM.png)

![Screen Shot 2021-09-16 at 1.10.38 PM.png](https://github.com/mgmeyers/obsidian-kanban/blob/main/docs/Assets/Screen%20Shot%202021-09-16%20at%201.10.38%20PM.png)

## Documentation

Find the plugin documentation here: [Obsidian Kanban Plugin Documentation](https://publish.obsidian.md/kanban/)

## Support

If you find this plugin useful and would like to support its development, you can sponsor [me](https://github.com/mgmeyers) on Github, or buy me a coffee.

[![GitHub Sponsors](https://img.shields.io/github/sponsors/mgmeyers?label=Sponsor&logo=GitHub%20Sponsors&style=for-the-badge)](https://github.com/sponsors/mgmeyers)

<a href="https://www.buymeacoffee.com/mgme"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=mgme&button_colour=5F7FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00"></a>
