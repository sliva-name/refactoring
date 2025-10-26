/**
 * Test file to demonstrate the Laravel Code Improver
 * 
 * Run: node test-example.js
 */

import { CodeAnalyzer } from './src/CodeAnalyzer.js';
import { MethodSizeAnalyzer } from './src/analyzers/MethodSizeAnalyzer.js';
import { LogicAnalyzer } from './src/analyzers/LogicAnalyzer.js';
import { TypeChecker } from './src/analyzers/TypeChecker.js';
import { DocBlockAnalyzer } from './src/analyzers/DocBlockAnalyzer.js';
import { ArchitectureAnalyzer } from './src/analyzers/ArchitectureAnalyzer.js';
import { Reporter } from './src/Reporter.js';

// Sample PHP code to test with
const samplePhpCode = `
<?php

namespace App\\Services;

use App\\Models\\User;
use Illuminate\\Support\\Facades\\DB;

class UserService
{
    /**
     * Process user order
     *
     * @param int $userId
     * @return array
     */
    public function processOrder($userId)
    {
        $user = User::find($userId);
        
        if ($user) {
            $orders = DB::table('orders')
                ->where('user_id', $userId)
                ->get();
            
            $total = 0;
            foreach ($orders as $order) {
                $total += $order->amount;
                
                if ($order->status === 'completed') {
                    $total += 10; // Bonus for completed orders
                }
            }
            
            return [
                'user_id' => $userId,
                'total' => $total,
                'orders_count' => count($orders)
            ];
        }
        
        return null;
    }
    
    public function updateUser($id, $data)
    {
        DB::table('users')->where('id', $id)->update($data);
    }
}
`;

async function testAnalyzers() {
  console.log('Testing Laravel Code Improver...\n');

  const testFilePath = 'app/Services/UserService.php';

  const analyzers = [
    new MethodSizeAnalyzer({ maxLines: 15 }),
    new LogicAnalyzer(),
    new TypeChecker(),
    new DocBlockAnalyzer(),
    new ArchitectureAnalyzer()
  ];

  let allIssues = [];

  for (const analyzer of analyzers) {
    try {
      const issues = analyzer.analyze(samplePhpCode, testFilePath);
      allIssues.push(...issues);
      console.log(`✓ ${analyzer.constructor.name}: Found ${issues.length} issues`);
    } catch (error) {
      console.error(`✗ ${analyzer.constructor.name}: ${error.message}`);
    }
  }

  console.log(`\nTotal issues found: ${allIssues.length}\n`);

  const reporter = new Reporter('test-report.json');
  
  const results = {
    totalFiles: 1,
    analyzedFiles: 1,
    issues: allIssues,
    statistics: {
      totalIssues: allIssues.length,
      byType: {},
      bySeverity: {
        critical: 0,
        major: 0,
        minor: 0,
        info: 0
      }
    }
  };

  allIssues.forEach(issue => {
    const type = issue.type || 'unknown';
    const severity = issue.severity || 'info';
    
    results.statistics.byType[type] = (results.statistics.byType[type] || 0) + 1;
    results.statistics.bySeverity[severity] = (results.statistics.bySeverity[severity] || 0) + 1;
  });

  await reporter.generateReport(results);

  console.log('\nTop issues:');
  allIssues
    .filter(i => i.severity === 'major' || i.severity === 'critical')
    .slice(0, 3)
    .forEach(issue => {
      console.log(`\n[${issue.type}] ${issue.message}`);
      console.log(`  File: ${issue.filePath}:${issue.line}`);
      if (issue.suggestion) {
        console.log(`  → ${issue.suggestion}`);
      }
    });

  console.log('\n✓ Test complete! Report saved to test-report.json');
}

testAnalyzers().catch(console.error);

