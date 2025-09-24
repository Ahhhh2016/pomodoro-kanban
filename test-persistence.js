/**
 * 测试脚本：验证focus time、estimate time和due datetime的持久化
 * 
 * 使用方法：
 * 1. 在Obsidian中打开开发者控制台 (Ctrl+Shift+I)
 * 2. 复制并粘贴此脚本
 * 3. 运行脚本
 * 4. 检查控制台输出
 */

(function() {
  console.log('🔍 开始测试数据持久化...');
  
  // 获取插件实例
  const plugin = window.app.plugins.plugins['pomodoro-kanban'];
  if (!plugin) {
    console.error('❌ 未找到Pomodoro Kanban插件');
    return;
  }
  
  // 获取StateManager
  const stateManagers = plugin.stateManagers;
  if (!stateManagers || stateManagers.size === 0) {
    console.error('❌ 未找到StateManager');
    return;
  }
  
  console.log(`✅ 找到 ${stateManagers.size} 个StateManager`);
  
  // 获取TimerManager
  const timerManager = plugin.timerManager;
  if (!timerManager) {
    console.error('❌ 未找到TimerManager');
    return;
  }
  
  console.log('✅ 找到TimerManager');
  
  // 测试每个board
  let totalItems = 0;
  let itemsWithFocusTime = 0;
  let itemsWithEstimateTime = 0;
  let itemsWithDueDate = 0;
  let itemsWithDueTime = 0;
  
  for (const [key, sm] of stateManagers) {
    console.log(`\n📋 检查Board: ${sm.file?.path || 'Unknown'}`);
    
    const board = sm.state;
    if (!board?.children) {
      console.log('  ⚠️  Board没有children');
      continue;
    }
    
    // 遍历所有lanes和items
    for (const lane of board.children) {
      if (!lane.children) continue;
      
      for (const item of lane.children) {
        totalItems++;
        
        // 检查focus time
        const focusTime = timerManager.getTotalFocused(item.id);
        if (focusTime > 0) {
          itemsWithFocusTime++;
          console.log(`  🎯 Item "${item.data?.title?.substring(0, 50)}..." 有focus time: ${Math.round(focusTime / 60000)}分钟`);
        }
        
        // 检查estimate time
        if (item.data?.metadata?.estimatetime) {
          itemsWithEstimateTime++;
          const estimateTime = item.data.metadata.estimatetime;
          console.log(`  ⏱️ Item "${item.data?.title?.substring(0, 50)}..." 有estimate time: ${estimateTime.format('HH:mm')}`);
        }
        
        // 检查due date
        if (item.data?.metadata?.duedate) {
          itemsWithDueDate++;
          const dueDate = item.data.metadata.duedate;
          console.log(`  📅 Item "${item.data?.title?.substring(0, 50)}..." 有due date: ${dueDate.format('YYYY-MM-DD')}`);
        }
        
        // 检查due time
        if (item.data?.metadata?.duetime) {
          itemsWithDueTime++;
          const dueTime = item.data.metadata.duetime;
          console.log(`  🕐 Item "${item.data?.title?.substring(0, 50)}..." 有due time: ${dueTime.format('HH:mm')}`);
        }
        
        // 检查原始数据
        if (item.data?.titleRaw) {
          const titleRaw = item.data.titleRaw;
          
          // 检查markdown中的timelog
          const timelogMatches = titleRaw.match(/^\s*(\+\+|🍅|⏱)\s.*$/gm);
          if (timelogMatches) {
            console.log(`  📝 Item "${item.data?.title?.substring(0, 50)}..." 有 ${timelogMatches.length} 个timelog条目`);
          }
          
          // 检查markdown中的due date
          const dueDateMatches = titleRaw.match(/due:@[^{]+/g);
          if (dueDateMatches) {
            console.log(`  📝 Item "${item.data?.title?.substring(0, 50)}..." 有 ${dueDateMatches.length} 个due date标记`);
          }
          
          // 检查markdown中的estimate time
          const estimateMatches = titleRaw.match(/estimate:@{[^}]+}/g);
          if (estimateMatches) {
            console.log(`  📝 Item "${item.data?.title?.substring(0, 50)}..." 有 ${estimateMatches.length} 个estimate time标记`);
          }
        }
      }
    }
  }
  
  // 输出统计结果
  console.log('\n📊 统计结果:');
  console.log(`  总Items: ${totalItems}`);
  console.log(`  有Focus Time: ${itemsWithFocusTime}`);
  console.log(`  有Estimate Time: ${itemsWithEstimateTime}`);
  console.log(`  有Due Date: ${itemsWithDueDate}`);
  console.log(`  有Due Time: ${itemsWithDueTime}`);
  
  // 测试强制重新解析
  console.log('\n🔄 测试强制重新解析...');
  timerManager.forceReparseLogs();
  console.log('✅ 强制重新解析完成');
  
  // 验证重新解析后的数据
  let reparseItemsWithFocusTime = 0;
  for (const [key, sm] of stateManagers) {
    const board = sm.state;
    if (!board?.children) continue;
    
    for (const lane of board.children) {
      if (!lane.children) continue;
      
      for (const item of lane.children) {
        const focusTime = timerManager.getTotalFocused(item.id);
        if (focusTime > 0) {
          reparseItemsWithFocusTime++;
        }
      }
    }
  }
  
  console.log(`\n📊 重新解析后统计:`);
  console.log(`  有Focus Time: ${reparseItemsWithFocusTime}`);
  
  if (itemsWithFocusTime === reparseItemsWithFocusTime) {
    console.log('✅ Focus Time数据一致性检查通过');
  } else {
    console.log('❌ Focus Time数据一致性检查失败');
  }
  
  console.log('\n🎉 测试完成！');
})();
