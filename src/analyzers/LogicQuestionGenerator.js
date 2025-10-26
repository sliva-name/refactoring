import Parser from 'tree-sitter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PHP = require('tree-sitter-php');

const getParser = () => {
  const parser = new Parser();
  parser.setLanguage(PHP);
  return parser;
};

/**
 * Генератор вопросов о логике кода
 * Помогает понять и проверить корректность логики
 */
export class LogicQuestionGenerator {
  constructor() {
    this.parser = getParser();
  }

  /**
   * Анализирует код и генерирует вопросы
   *
   * @param string code Исходный код PHP
   * @param string filePath Путь к файлу
   * @return array
   */
  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    this.analyzeLogic(code, filePath, tree.rootNode, issues);

    return issues;
  }

  /**
   * Анализирует логику и генерирует вопросы
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  analyzeLogic(code, filePath, node, issues) {
    // Исключаем migrations, seeders, factories - там вопросы излишни
    const isExcludedFile = filePath.includes('migrations') || 
                          filePath.includes('seeders') || 
                          filePath.includes('factories') ||
                          filePath.includes('routes');
    
    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodName = this.getMethodName(node);
      const methodText = node.text;
      const line = node.startPosition.row + 1;

      const questions = this.generateQuestions(methodText, methodName, line);

      // Не генерируем вопросы для простых helper методов
      const isSimpleHelper = methodName.includes('success') || 
                             methodName.includes('error') || 
                             methodName.includes('data') ||
                             methodName.includes('created') ||
                             methodName.includes('notFound') ||
                             methodName.includes('forbidden') ||
                             methodName.includes('unauthorized') ||
                             methodName.includes('noContent') ||
                             methodName.startsWith('scope');
      
      // Конструкторы не требуют вопросов о логике
      const isConstructor = methodName === '__construct' || methodName === '__destruct';

      // Проверка на простой query-метод (один return со where/orderBy/with без условий и циклов)
      const isSimpleQueryMethod = methodName.startsWith('scope') && 
                                  methodText.includes('return $query') &&
                                  !methodText.includes('if') &&
                                  !methodText.includes('foreach') &&
                                  !methodText.includes('for (');

      if (questions.length > 0 && !isExcludedFile && !isSimpleHelper && !isSimpleQueryMethod && !isConstructor) {
        issues.push({
          type: 'logic_questions',
          severity: 'info',
          message: `Questions about logic in method "${methodName}"`,
          filePath,
          line: line,
          suggestion: 'Review these questions to ensure logic correctness',
          questions: questions
        });
      }
    }

    for (const child of node.children) {
      this.analyzeLogic(code, filePath, child, issues);
    }
  }

  /**
   * Генерирует вопросы о логике метода
   *
   * @param string methodText
   * @param string methodName
   * @param number line
   * @return array
   */
  generateQuestions(methodText, methodName, line) {
    const questions = [];

    // 1. Проверка условий
    this.checkConditions(methodText, methodName, questions);

    // 2. Проверка циклов
    this.checkLoops(methodText, methodName, questions);

    // 3. Проверка null/undefined
    this.checkNullHandling(methodText, methodName, questions);

    // 4. Проверка граничных случаев
    this.checkEdgeCases(methodText, methodName, questions);

    // 5. Проверка транзакций
    this.checkTransactions(methodText, methodName, questions);

    // 6. Проверка валидации
    this.checkValidation(methodText, methodName, questions);

    // 7. Проверка возвращаемых значений
    this.checkReturnValues(methodText, methodName, questions);

    // 8. Проверка исключений
    this.checkExceptions(methodText, methodName, questions);

    return questions;
  }

  /**
   * Вопросы об условиях
   *
   * @param string methodText
   * @param string methodName
   * @param array questions
   * @return void
   */
  checkConditions(methodText, methodName, questions) {
    const ifCount = (methodText.match(/if\s*\(/g) || []).length;

    if (ifCount > 3) {
      questions.push({
        category: 'conditions',
        priority: 'high',
        question: `В методе ${methodName} ${ifCount} условных операторов. Все ли случаи обработаны?`,
        checkPoints: [
          'Есть ли else для каждого важного if?',
          'Что происходит если все условия false?',
          'Могут ли условия пересекаться?'
        ],
        expectedAnswer: 'Да, все случаи обработаны и покрыты тестами'
      });
    }

    if (methodText.includes('if') && !methodText.includes('else')) {
      questions.push({
        category: 'conditions',
        priority: 'medium',
        question: 'Есть if без else. Что происходит в альтернативном случае?',
        checkPoints: [
          'Нужна ли обработка альтернативного случая?',
          'Корректно ли поведение по умолчанию?'
        ],
        expectedAnswer: 'Альтернативный случай обрабатывается корректно или не требуется'
      });
    }

    if (methodText.match(/if\s*\([^)]*&&[^)]*&&/)) {
      questions.push({
        category: 'conditions',
        priority: 'high',
        question: 'Сложное условие с множественными &&. Правильный ли порядок проверок?',
        checkPoints: [
          'Дешевые проверки идут первыми?',
          'Нет ли повторяющихся проверок?',
          'Можно ли упростить условие?'
        ],
        expectedAnswer: 'Порядок оптимален, условие максимально простое'
      });
    }
  }

  /**
   * Вопросы о циклах
   *
   * @param string methodText
   * @param string methodName
   * @param array questions
   * @return void
   */
  checkLoops(methodText, methodName, questions) {
    const hasLoop = methodText.includes('foreach') || methodText.includes('for (') || methodText.includes('while');

    if (hasLoop) {
      questions.push({
        category: 'loops',
        priority: 'high',
        question: 'Что произойдет если коллекция пустая?',
        checkPoints: [
          'Проверяется ли пустота перед циклом?',
          'Корректно ли поведение для пустой коллекции?',
          'Есть ли тесты для этого случая?'
        ],
        expectedAnswer: 'Пустая коллекция обрабатывается корректно'
      });

      if (methodText.includes('foreach') && !methodText.includes('empty(')) {
        questions.push({
          category: 'loops',
          priority: 'medium',
          question: 'Нет проверки на пустоту перед циклом. Это намеренно?',
          checkPoints: [
            'Гарантированно ли что коллекция не пустая?',
            'Нужно ли добавить проверку?'
          ],
          expectedAnswer: 'Коллекция гарантированно не пустая или пустая коллекция обрабатывается корректно'
        });
      }

      if (methodText.includes('break') || methodText.includes('continue')) {
        questions.push({
          category: 'loops',
          priority: 'high',
          question: 'В цикле используется break/continue. Правильно ли это работает?',
          checkPoints: [
            'Все ли edge cases обработаны?',
            'Что если выход из цикла произошел досрочно?',
            'Корректно ли состояние после break/continue?'
          ],
          expectedAnswer: 'Досрочный выход обрабатывается корректно'
        });
      }
    }

    if (methodText.match(/foreach[^}]*foreach/)) {
      questions.push({
        category: 'loops',
        priority: 'critical',
        question: 'Вложенные циклы. Какая сложность O()?',
        checkPoints: [
          'Оптимальна ли сложность алгоритма?',
          'Можно ли заменить на один цикл?',
          'Есть ли проблемы производительности?'
        ],
        expectedAnswer: 'Сложность оптимальна для данной задачи'
      });
    }
  }

  /**
   * Вопросы об обработке null/undefined
   *
   * @param string methodText
   * @param string methodName
   * @param array questions
   * @return void
   */
  checkNullHandling(methodText, methodName, questions) {
    if (methodText.includes('->') && !methodText.includes('??') && !methodText.includes('if (')) {
      questions.push({
        category: 'null_safety',
        priority: 'critical',
        question: 'Обращение к свойству/методу без проверки на null. Что если объект null?',
        checkPoints: [
          'Гарантированно ли что объект не null?',
          'Нужна ли проверка с ??',
          'Что должно произойти если null?'
        ],
        expectedAnswer: 'Объект гарантированно не null или есть обработка null'
      });
    }

    if (methodText.includes('find(') && !methodText.includes('if (!')) {
      questions.push({
        category: 'null_safety',
        priority: 'high',
        question: 'Используется find() без проверки результата. Что если запись не найдена?',
        checkPoints: [
          'Обрабатывается ли случай когда find() вернет null?',
          'Нужно ли выбросить exception?',
          'Корректно ли дальнейшее выполнение?'
        ],
        expectedAnswer: 'Случай не найденной записи обрабатывается (exception или проверка)'
      });
    }

    if (methodText.includes('first()') && !methodText.includes('firstOr')) {
      questions.push({
        category: 'null_safety',
        priority: 'medium',
        question: 'first() может вернуть null. Это обработано?',
        checkPoints: [
          'Гарантированно ли что запись существует?',
          'Лучше использовать firstOrFail()?'
        ],
        expectedAnswer: 'Null от first() обрабатывается или запись гарантированно существует'
      });
    }
  }

  /**
   * Вопросы о граничных случаях
   *
   * @param string methodText
   * @param string methodName
   * @param array questions
   * @return void
   */
  checkEdgeCases(methodText, methodName, questions) {
    if (methodText.includes('array') || methodText.includes('[]')) {
      questions.push({
        category: 'edge_cases',
        priority: 'high',
        question: 'Работа с массивами. Протестированы ли граничные случаи?',
        checkPoints: [
          'Пустой массив - что произойдет?',
          'Массив с одним элементом - корректно?',
          'Очень большой массив - нет проблем с памятью?'
        ],
        expectedAnswer: 'Все граничные случаи протестированы'
      });
    }

    // Проверяем только явные операции с числами (арифметика, сравнения)
    // Не проверяем каждое вхождение цифры (слишком много false positives)
    const hasNumberOperations = /[+\-*\/%]\s*\d+|[<>=!]=?\s*\d+|\d+\s*[<>=!]=?/.test(methodText);
    const hasDivision = methodText.includes('/') && /\/\s*[^\/]/.test(methodText); // деление, но не //
    
    if (hasNumberOperations || hasDivision) {
      questions.push({
        category: 'edge_cases',
        priority: 'medium',
        question: 'Используются числовые операции. Проверены ли крайние значения?',
        checkPoints: [
          'Что при значении 0? (особенно деление на 0)',
          'Что при отрицательных числах?',
          'Что при очень больших числах?'
        ],
        expectedAnswer: 'Крайние значения обрабатываются корректно'
      });
    }

    if (methodText.includes('string') || methodText.includes('str_')) {
      questions.push({
        category: 'edge_cases',
        priority: 'medium',
        question: 'Работа со строками. Обработаны ли специальные случаи?',
        checkPoints: [
          'Пустая строка - корректно?',
          'Строка с пробелами - обрабатывается?',
          'Очень длинная строка - нет проблем?',
          'Спецсимволы и emoji - корректно?'
        ],
        expectedAnswer: 'Все специальные случаи строк обработаны'
      });
    }
  }

  /**
   * Вопросы о транзакциях
   *
   * @param string methodText
   * @param string methodName
   * @param array questions
   * @return void
   */
  checkTransactions(methodText, methodName, questions) {
    const hasCreate = methodText.includes('::create') || methodText.includes('->create');
    const hasUpdate = methodText.includes('->update');
    const hasDelete = methodText.includes('->delete');
    const modificationCount = [hasCreate, hasUpdate, hasDelete].filter(Boolean).length;

    if (modificationCount >= 2 && !methodText.includes('transaction')) {
      questions.push({
        category: 'transactions',
        priority: 'critical',
        question: 'Множественные модификации БД без транзакции. Что если одна операция упадет?',
        checkPoints: [
          'Обеспечена ли атомарность операций?',
          'Что произойдет при частичном выполнении?',
          'Нужна ли транзакция?'
        ],
        expectedAnswer: 'Транзакция используется или операции независимы'
      });
    }

    if (methodText.includes('transaction') && methodText.includes('try')) {
      questions.push({
        category: 'transactions',
        priority: 'medium',
        question: 'Транзакция с try-catch. Правильно ли обрабатываются исключения?',
        checkPoints: [
          'Rollback происходит автоматически?',
          'Нужно ли явно вызывать rollback?',
          'Логируется ли ошибка?'
        ],
        expectedAnswer: 'Rollback происходит корректно, ошибки логируются'
      });
    }
  }

  /**
   * Вопросы о валидации
   *
   * @param string methodText
   * @param string methodName
   * @param array questions
   * @return void
   */
  checkValidation(methodText, methodName, questions) {
    // Методы request, которые НЕ требуют валидации (безопасные геттеры)
    const safeRequestMethods = [
      'user()', 'ip()', 'path()', 'url()', 'fullUrl()', 
      'method()', 'isMethod(', 'route()', 'header(',
      'bearerToken()', 'hasHeader('
    ];
    
    // Проверяем только если есть доступ к входным данным (input, all, get, post)
    const hasInputAccess = methodText.includes('$request->input') ||
                          methodText.includes('$request->all()') ||
                          methodText.includes('$request->get(') ||
                          methodText.includes('$request->post(');
    
    const hasSafeMethodOnly = safeRequestMethods.some(method => methodText.includes(`$request->${method}`));
    
    if (hasInputAccess && !methodText.includes('validate') && !hasSafeMethodOnly) {
      questions.push({
        category: 'validation',
        priority: 'high',
        question: 'Используется $request->input без валидации. Данные проверены?',
        checkPoints: [
          'Валидация происходит в FormRequest?',
          'Все ли поля проверены?',
          'Защищены ли от XSS и SQL Injection?'
        ],
        expectedAnswer: 'Валидация выполнена в FormRequest или методе'
      });
    }

    if (methodText.includes('$_GET') || methodText.includes('$_POST')) {
      questions.push({
        category: 'validation',
        priority: 'critical',
        question: 'Прямое использование суперглобалов! Это безопасно?',
        checkPoints: [
          'Почему не используется $request?',
          'Данные валидируются и санитизируются?',
          'Нет ли уязвимостей безопасности?'
        ],
        expectedAnswer: 'Использование оправдано, данные проверены на безопасность'
      });
    }
  }

  /**
   * Вопросы о возвращаемых значениях
   *
   * @param string methodText
   * @param string methodName
   * @param array questions
   * @return void
   */
  checkReturnValues(methodText, methodName, questions) {
    const returnCount = (methodText.match(/return /g) || []).length;

    if (returnCount > 3) {
      questions.push({
        category: 'return_values',
        priority: 'medium',
        question: `Метод имеет ${returnCount} точек возврата. Все ли случаи покрыты?`,
        checkPoints: [
          'Возвращается ли согласованный тип во всех случаях?',
          'Нет ли пропущенных return?',
          'Можно ли упростить логику?'
        ],
        expectedAnswer: 'Все пути возврата покрыты и согласованы'
      });
    }

    if (methodText.includes('return') && methodText.includes('?:')) {
      questions.push({
        category: 'return_values',
        priority: 'low',
        question: 'Тернарный оператор в return. Все ли случаи очевидны?',
        checkPoints: [
          'Логика понятна без комментариев?',
          'Оба значения ожидаемого типа?'
        ],
        expectedAnswer: 'Логика понятна, типы согласованы'
      });
    }

    if (!methodText.includes('return') && !methodText.includes('void')) {
      questions.push({
        category: 'return_values',
        priority: 'medium',
        question: 'Метод без return. Это void метод?',
        checkPoints: [
          'Указан ли тип возврата void?',
          'Не забыт ли return?'
        ],
        expectedAnswer: 'Это намеренно void метод'
      });
    }
  }

  /**
   * Вопросы об исключениях
   *
   * @param string methodText
   * @param string methodName
   * @param array questions
   * @return void
   */
  checkExceptions(methodText, methodName, questions) {
    if (methodText.includes('throw') && !methodText.includes('try')) {
      questions.push({
        category: 'exceptions',
        priority: 'high',
        question: 'Метод выбрасывает исключение. Кто его ловит?',
        checkPoints: [
          'Исключение документировано в PHPDoc?',
          'Вызывающий код готов к исключению?',
          'Используется ли правильный тип исключения?'
        ],
        expectedAnswer: 'Исключение документировано и корректно обрабатывается'
      });
    }

    if (methodText.includes('catch') && methodText.includes('{}')) {
      questions.push({
        category: 'exceptions',
        priority: 'critical',
        question: 'Пустой catch блок! Исключение проглатывается?',
        checkPoints: [
          'Почему исключение игнорируется?',
          'Нужно ли его логировать?',
          'Корректно ли дальнейшее выполнение?'
        ],
        expectedAnswer: 'Игнорирование исключения оправдано или нужно добавить обработку'
      });
    }

    if (methodText.includes('catch') && !methodText.includes('Log::')) {
      questions.push({
        category: 'exceptions',
        priority: 'medium',
        question: 'Catch без логирования. Ошибка будет отслежена?',
        checkPoints: [
          'Исключение логируется выше по стеку?',
          'Нужно ли добавить логирование?'
        ],
        expectedAnswer: 'Логирование не требуется или происходит выше'
      });
    }
  }

  /**
   * Получает имя метода
   *
   * @param object node
   * @return string
   */
  getMethodName(node) {
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }
    return 'anonymous';
  }
}

