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
- **Quick Stop**: If you stop a timer within 1 minute, it won't ask for a reason and won't be logged
- **Time Logging**: Automatic logging of work sessions to card markdown
- **Interrupt Tracking**: Track why you stopped a session (for sessions longer than 1 minute)
- **Sound Notifications**: Audio alerts when sessions complete
- **Customizable Settings**: Configure timer durations, interrupt reasons, and sound preferences

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
