/**
 * # angular-elastic-builder
 * ## Angular Module for building an Elasticsearch Query
 *
 * @version v1.5.1
 * @link https://github.com/dncrews/angular-elastic-builder.git
 * @license MIT
 * @author Dan Crews <crewsd@gmail.com>
 */

/**
 * angular-elastic-builder
 *
 * /src/module.js
 *
 * Angular Module for building an Elasticsearch query
 */

(function(angular) {
  'use strict';

  angular.module('angular-elastic-builder', [
    'RecursionHelper',
    'ui.bootstrap',
  ]);

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/directives/BuilderDirective.js
 *
 * Angular Directive for injecting a query builder form.
 */

 (function(angular) {
   'use strict';

   angular.module('angular-elastic-builder')
    .directive('elasticBuilder', [
      'elasticQueryService',

      function EB(elasticQueryService) {

        return {
          scope: {
            data: '=elasticBuilder',
          },

          templateUrl: 'angular-elastic-builder/BuilderDirective.html',

          link: function(scope) {
            var data = scope.data;

            scope.filters = [];

            /**
             * Removes either Group or Rule
             */
            scope.removeChild = function(idx) {
              scope.filters.splice(idx, 1);
            };

            /**
             * Adds a Single Rule
             */
            scope.addRule = function() {
              scope.filters.push({});
            };

            /**
             * Adds a Group of Rules
             */
            scope.addGroup = function() {
              scope.filters.push({
                type: 'group',
                subType: 'and',
                rules: [],
              });
            };

            /**
             * Any time "outside forces" change the query, they should tell us so via
             * `data.needsUpdate`
             */
            scope.$watch('data.needsUpdate', function(curr) {
              if (!curr) return;

              scope.filters = elasticQueryService.toFilters(data.query, scope.data.fields);
              scope.data.needsUpdate = false;
            });

            /**
             * Changes on the page update the Query
             */
            scope.$watch('filters', function(curr) {
              if (!curr) return;

              data.query = elasticQueryService.toQuery(scope.filters, scope.data.fields);
            }, true);
          },
        };
      },

    ]);

 })(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/directives/Chooser.js
 *
 * This file is to help recursively, to decide whether to show a group or rule
 */

(function(angular) {
  'use strict';

  var app = angular.module('angular-elastic-builder');

  app.directive('elasticBuilderChooser', [
    'RecursionHelper',
    'groupClassHelper',

    function elasticBuilderChooser(RH, groupClassHelper) {

      return {
        scope: {
          elasticFields: '=',
          item: '=elasticBuilderChooser',
          onRemove: '&',
        },

        templateUrl: 'angular-elastic-builder/ChooserDirective.html',

        compile: function (element) {
          return RH.compile(element, function(scope, el, attrs) {
            var depth = scope.depth = (+attrs.depth)
              , item = scope.item;

            scope.getGroupClassName = function() {
              var level = depth;
              if (item.type === 'group') level++;

              return groupClassHelper(level);
            };
          });
        },
      };
    },

  ]);

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/directives/Group.js
 */

(function(angular) {
  'use strict';

  var app = angular.module('angular-elastic-builder');

  app.directive('elasticBuilderGroup', [
    'RecursionHelper',
    'groupClassHelper',

    function elasticBuilderGroup(RH, groupClassHelper) {

      return {
        scope: {
          elasticFields: '=',
          group: '=elasticBuilderGroup',
          onRemove: '&',
        },

        templateUrl: 'angular-elastic-builder/GroupDirective.html',

        compile: function(element) {
          return RH.compile(element, function(scope, el, attrs) {
            var depth = scope.depth = (+attrs.depth);
            var group = scope.group;

            scope.addRule = function() {
              group.rules.push({});
            };
            scope.addGroup = function() {
              group.rules.push({
                type: 'group',
                subType: 'and',
                rules: [],
              });
            };

            scope.removeChild = function(idx) {
              group.rules.splice(idx, 1);
            };

            scope.getGroupClassName = function() {
              return groupClassHelper(depth + 1);
            };
          });
        },
      };
    },

  ]);

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/directives/Rule.js
 */

(function(angular) {
  'use strict';

  var app = angular.module('angular-elastic-builder');

  app.directive('elasticBuilderRule', [

    function elasticBuilderRule() {
      return {
        scope: {
          elasticFields: '=',
          rule: '=elasticBuilderRule',
          onRemove: '&',
        },

        templateUrl: 'angular-elastic-builder/RuleDirective.html',

        link: function(scope) {
          scope.getType = function() {
            var fields = scope.elasticFields
              , field = scope.rule.field;

            if (!fields || !field) return;

            if (fields[field].subType === 'boolean') return 'boolean';

            return fields[field].type;
          };
        },
      };
    },

  ]);

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/directives/RuleTypes.js
 *
 * Determines which Rule type should be displayed
 */

(function(angular) {
  'use strict';

  var app = angular.module('angular-elastic-builder');

  app.directive('elasticType', [

    function() {
      return {
        scope: {
          type: '=elasticType',
          rule: '=',
          guide: '=',
        },

        template: '<ng-include src="getTemplateUrl()" />',

        link: function(scope) {
          scope.getTemplateUrl = function() {
            var type = scope.type;
            if (!type) return;

            type = type.charAt(0).toUpperCase() + type.slice(1);

            return 'angular-elastic-builder/types/' + type + '.html';
          };

          // This is a weird hack to make sure these are numbers
          scope.booleans = [ 'False', 'True' ];
          scope.booleansOrder = [ 'True', 'False' ];

          scope.inputNeeded = function() {
            var needs = [
              'equals',
              'notEquals',

              'gt',
              'gte',
              'lt',
              'lte',
            ];

            return ~needs.indexOf(scope.rule.subType);
          };

          scope.numberNeeded = function() {
            var needs = [
              'last',
              'next',
            ];

            return ~needs.indexOf(scope.rule.subType);
          };

          scope.today = function() {
            scope.rule.date = new Date();
          };
          scope.today();

          scope.clear = function() {
            scope.rule.date = null;
          };

          scope.dateOptions = {
            dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(2018, 1, 13),
            minDate: new Date(),
            startingDay: 1,
          };

          // Disable weekend selection
          function disabled(data) {
            var date = data.date
              , mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
          }

          scope.open1 = function() {
            scope.popup1.opened = true;
          };

          scope.setDate = function(year, month, day) {
            scope.rule.date = new Date(year, month - 1, day);
          };

          scope.formats = [
            'yyyy-MM-ddTHH:mm:ss',
            'yyyy-MM-ddTHH:mm:ssZ',
            'yyyy-MM-dd',
            'dd-MMMM-yyyy',
            'yyyy/MM/dd',
            'shortDate',
          ];
          scope.rule.dateFormat = scope.formats[0];
          scope.format = scope.rule.dateFormat;

          scope.altInputFormats = ['M!/d!/yyyy'];

          scope.popup1 = { opened: false };
        },

      };
    },

  ]);

})(window.angular);

(function(angular) {"use strict"; angular.module("angular-elastic-builder").run(["$templateCache", function($templateCache) {$templateCache.put("angular-elastic-builder/BuilderDirective.html","<div class=\"elastic-builder\">\n  <div class=\"filter-panels\">\n    <div class=\"list-group form-inline\">\n      <div\n        data-ng-repeat=\"filter in filters\"\n        data-elastic-builder-chooser=\"filter\"\n        data-elastic-fields=\"data.fields\"\n        data-on-remove=\"removeChild($index)\"\n        data-depth=\"0\"></div>\n      <div class=\"list-group-item actions\">\n        <md-button class=\"md-icon-button md-accent\" aria-label=\"Add Rule\" title=\"Add Rule\" data-ng-click=\"addRule()\">\n          <md-icon md-font-icon=\"icon-plus\"></md-icon>\n        </md-button>\n        <md-button class=\"md-icon-button md-accent\" aria-label=\"Add Group\" title=\"Add Group\" data-ng-click=\"addGroup()\">\n          <md-icon md-font-icon=\"icon-view-list\"></md-icon>\n        </md-button>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("angular-elastic-builder/ChooserDirective.html","<div\n  class=\"list-group-item elastic-builder-chooser\"\n  data-ng-class=\"getGroupClassName()\">\n\n  <div data-ng-if=\"item.type === \'group\'\"\n    data-elastic-builder-group=\"item\"\n    data-depth=\"{{ depth }}\"\n    data-elastic-fields=\"elasticFields\"\n    data-on-remove=\"onRemove()\"></div>\n\n  <div data-ng-if=\"item.type !== \'group\'\"\n    data-elastic-builder-rule=\"item\"\n    data-elastic-fields=\"elasticFields\"\n    data-on-remove=\"onRemove()\"></div>\n\n</div>\n");
$templateCache.put("angular-elastic-builder/GroupDirective.html","<div class=\"elastic-builder-group\">\n  <h5>If\n    <select data-ng-model=\"group.subType\" class=\"form-control\">\n      <option value=\"and\">all</option>\n      <option value=\"or\">any</option>\n    </select>\n    of these conditions are met\n  </h5>\n  <div\n    data-ng-repeat=\"rule in group.rules\"\n    data-elastic-builder-chooser=\"rule\"\n    data-elastic-fields=\"elasticFields\"\n    data-depth=\"{{ +depth + 1 }}\"\n    data-on-remove=\"removeChild($index)\"></div>\n\n  <div class=\"list-group-item actions\" data-ng-class=\"getGroupClassName()\">\n    <a class=\"btn btn-xs btn-primary\" title=\"Add Sub-Rule\" data-ng-click=\"addRule()\">\n      <i class=\"fa fa-plus\"></i>\n    </a>\n    <a class=\"btn btn-xs btn-primary\" title=\"Add Sub-Group\" data-ng-click=\"addGroup()\">\n      <i class=\"fa fa-list\"></i>\n    </a>\n  </div>\n\n  <a class=\"btn btn-xs btn-danger remover\" data-ng-click=\"onRemove()\">\n    <i class=\"fa fa-minus\"></i>\n  </a>\n</div>\n");
$templateCache.put("angular-elastic-builder/RuleDirective.html","<div class=\"elastic-builder-rule\">\n  <md-input-container>\n    <label>Field</label>\n    <md-select data-ng-model=\"rule.field\" class=\"form-control\">\n      <md-option ng-value=\"key\" ng-repeat=\"(key, value) in elasticFields\">{{key}}</md-option>\n    </md-select>\n  </md-input-container>\n\n  <span data-elastic-type=\"getType()\" data-rule=\"rule\" data-guide=\"elasticFields[rule.field]\"></span>\n\n  <md-button class=\"md-icon-button md-accent remover\" aria-label=\"Remove\" title=\"Remove\" data-ng-click=\"onRemove()\">\n    <md-icon md-font-icon=\"icon-minus\"></md-icon>\n  </md-button>\n\n</div>\n");
$templateCache.put("angular-elastic-builder/types/Boolean.html","<span class=\"boolean-rule\">\n  Equals\n\n  <!-- This is a weird hack to make sure these are numbers -->\n  <md-input-container>\n    <md-select data-ng-model=\"rule.value\" class=\"form-control\">\n      <md-option ng-value=\"booleans.indexOf(choice)\" ng-repeat=\"choice in booleansOrder\">{{choice}}</md-option>\n    </md-select>\n  </md-input-container>\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Date.html","<span class=\"date-rule form-inline\">\n  <md-input-container>\n    <md-select data-ng-model=\"rule.subType\" class=\"form-control\">\n      <!--  Exact -->\n      <md-optgroup label=\"Exact\">\n        <md-option value=\"equals\">=</md-option>\n      </md-optgroup>\n\n      <!-- Unbounded Range Options -->\n      <md-optgroup label=\"Unbounded-range\">\n        <md-option value=\"gt\">&gt;</md-option>\n        <md-option value=\"gte\">&ge;</md-option>\n        <md-option value=\"lt\">&lt;</md-option>\n        <md-option value=\"lte\">&le;</md-option>\n      </md-optgroup>\n\n      <!--  Bounded Range -->\n      <md-optgroup label=\"Bounded-range\">\n        <md-option value=\"last\">In the last</md-option>\n        <md-option value=\"next\">In the next</md-option>\n      </md-optgroup>\n\n      <!-- Generic Options -->\n      <md-optgroup label=\"Generic\">\n        <md-option value=\"exists\">Exists</md-option>\n        <md-option value=\"notExists\">! Exists</md-option>\n      </md-optgroup>\n\n    </md-select>\n  </md-input-container>\n\n  <md-datepicker\n    data-ng-if=\"inputNeeded()\"\n    data-ng-model=\"rule.date\"\n    md-placeholder=\"Enter date\"\n    data-ng-required=\"true\"\n  ></md-datepicker>\n\n  <md-input-container data-ng-if=\"inputNeeded()\">\n    <label>Format</label>\n    <md-select data-ng-model=\"rule.dateFormat\" class=\"form-control\">\n      <md-option ng-value=\"format\" ng-repeat=\"format in formats\">{{format}}</md-option>\n    </md-select>\n  </md-input-container>\n\n  <md-input-container data-ng-if=\"numberNeeded()\">\n    <label>Days</label>\n    <input type=\"number\" class=\"form-control\" data-ng-model=\"rule.value\" min=0>\n  </md-input-container>\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Multi.html","<span class=\"multi-rule\">\n  <span data-ng-repeat=\"choice in guide.choices\">\n    <md-checkbox data-ng-model=\"rule.values[choice]\" aria-label=\"{{ choice }}\">\n      {{ choice }}\n    </md-checkbox>\n  </span>\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Number.html","<span class=\"number-rule\">\n  <md-input-container>\n    <md-select data-ng-model=\"rule.subType\" class=\"form-control\">\n\n      <!-- Term Options -->\n      <md-optgroup label=\"Numeral\">\n        <md-option value=\"equals\">=</md-option>\n        <md-option value=\"gt\">&gt;</md-option>\n        <md-option value=\"gte\">&ge;</md-option>\n        <md-option value=\"lt\">&lt;</md-option>\n        <md-option value=\"lte\">&le;</md-option>\n      </md-optgroup>\n\n      <!-- Generic Options -->\n      <md-optgroup label=\"Generic\">\n        <md-option value=\"exists\">Exists</md-option>\n        <md-option value=\"notExists\">! Exists</md-option>\n      </md-optgroup>\n\n    </md-select>\n  </md-input-container>\n  <md-input-container>\n    <label>Value</label>\n    <!-- Range Fields -->\n    <input data-ng-if=\"inputNeeded()\"\n      class=\"form-control\"\n      data-ng-model=\"rule.value\"\n      type=\"number\"\n      min=\"{{ guide.minimum }}\"\n      max=\"{{ guide.maximum }}\">\n  </md-input-container>\n\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Term.html","<span class=\"elastic-term\">\n  <md-input-container>\n    <md-select data-ng-model=\"rule.subType\" class=\"form-control\">\n\n      <!-- Term Options -->\n      <md-optgroup label=\"Text\">\n        <md-option value=\"equals\">Equals</md-option>\n        <md-option value=\"notEquals\">! Equals</md-option>\n      </md-optgroup>\n\n      <!-- Generic Options -->\n      <md-optgroup label=\"Generic\">\n        <md-option value=\"exists\">Exists</md-option>\n        <md-option value=\"notExists\">! Exists</md-option>\n      </md-optgroup>\n\n    </md-select>\n  </md-input-container>\n  <md-input-container>\n    <label>Value</label>\n    <input\n      data-ng-if=\"inputNeeded()\"\n      class=\"form-control\"\n      data-ng-model=\"rule.value\"\n      type=\"text\">\n  </md-input-container>\n</span>\n");}]);})(window.angular);
/**
 * angular-elastic-builder
 *
 * /src/services/GroupClassHelper.js
 *
 * This keeps all of the groups colored correctly
 */

(function(angular) {
  'use strict';

  angular.module('angular-elastic-builder')
    .factory('groupClassHelper', function groupClassHelper() {

      return function(level) {
        var levels = [
          '',
          'list-group-item-info',
          'list-group-item-success',
          'list-group-item-warning',
          'list-group-item-danger',
        ];

        return levels[level % levels.length];
      };
    });

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/services/QueryService.js
 *
 * This file is used to convert filters into queries, and vice versa
 */

(function(angular) {
  'use strict';

  angular.module('angular-elastic-builder')
    .factory('elasticQueryService', [
      '$filter',

      function($filter) {

        return {
          toFilters: toFilters,
          toQuery: function(filters, fieldMap) {
            return toQuery(filters, fieldMap, $filter);
          },
        };
      },
    ]);

  function toFilters(query, fieldMap){
    var filters = query.map(parseQueryGroup.bind(query, fieldMap));
    return filters;
  }

  function toQuery(filters, fieldMap, $filter){
    var query = filters.map(parseFilterGroup.bind(filters, fieldMap, $filter)).filter(function(item) {
      return !!item;
    });
    return query;
  }

  function parseQueryGroup(fieldMap, group, truthy) {
    if (truthy !== false) truthy = true;

    var key = Object.keys(group)[0]
      , typeMap = {
        or: 'group',
        and: 'group',
        range: 'number',
      }
      , type = typeMap[key] || 'item'
      , obj = getFilterTemplate(type);

    switch (key) {
      case 'or':
      case 'and':
        obj.rules = group[key].map(parseQueryGroup.bind(group, fieldMap));
        obj.subType = key;
        break;
      case 'missing':
      case 'exists':
        obj.field = group[key].field;
        obj.subType = {
          exists: 'exists',
          missing: 'notExists',
        }[key];
        delete obj.value;
        break;
      case 'term':
      case 'terms':
        obj.field = Object.keys(group[key])[0];
        var fieldData = fieldMap[Object.keys(group[key])[0]];

        if (fieldData.type === 'multi') {
          var vals = group[key][obj.field];
          if (typeof vals === 'string') vals = [ vals ];
          obj.values = fieldData.choices.reduce(function(prev, choice) {
            prev[choice] = group[key][obj.field].indexOf(choice) !== -1;
            return prev;
          }, {});
        } else {
          obj.subType = truthy ? 'equals' : 'notEquals';
          obj.value = group[key][obj.field];

          if (typeof obj.value === 'number') {
            obj.subType = 'boolean';
          }
        }
        break;
      case 'range':
        var date, parts;
        obj.field = Object.keys(group[key])[0];
        obj.subType = Object.keys(group[key][obj.field])[0];

        if (angular.isNumber(group[key][obj.field][obj.subType])) {
          obj.value = group[key][obj.field][obj.subType];
          break;
        }

        if (angular.isDefined(Object.keys(group[key][obj.field])[1])) {
          date = group[key][obj.field].gte;

          if (~date.indexOf('now-')) {
            obj.subType = 'last';
            obj.value = parseInt(date.split('now-')[1].split('d')[0]);
            break;
          }

          if (~date.indexOf('now')) {
            obj.subType = 'next';
            date = group[key][obj.field].lte;
            obj.value = parseInt(date.split('now+')[1].split('d')[0]);
            break;
          }

          obj.subType = 'equals';
          parts = date.split('T')[0].split('-');
          obj.date = parts[2] + '/' + parts[1] + '/' + parts[0];
          break;
        }

        date = group[key][obj.field][obj.subType];
        parts = date.split('T')[0].split('-');
        obj.date = parts[2] + '/' + parts[1] + '/' + parts[0];
        break;

      case 'not':
        obj = parseQueryGroup(fieldMap, group[key].filter, false);
        break;
      default:
        obj.field = Object.keys(group[key])[0];
        break;
    }

    return obj;
  }

  function parseFilterGroup(fieldMap, $filter, group) {
    var obj = {};
    if (group.type === 'group') {
      obj[group.subType] = group.rules.map(parseFilterGroup.bind(group, fieldMap, $filter)).filter(function(item) {
        return !!item;
      });
      return obj;
    }

    var fieldName = group.field;
    var fieldData = fieldMap[fieldName];


    if (!fieldName) return;

    switch (fieldData.type) {
      case 'term':
        if (fieldData.subType === 'boolean') group.subType = 'boolean';

        if (!group.subType) return;
        switch (group.subType) {
          case 'equals':
          case 'boolean':
            if (group.value === undefined) return;
            obj.term = {};
            obj.term[fieldName] = group.value;
            break;
          case 'notEquals':
            if (group.value === undefined) return;
            obj.not = { filter: { term: {}}};
            obj.not.filter.term[fieldName] = group.value;
            break;
          case 'exists':
            obj.exists = { field: fieldName };
            break;
          case 'notExists':
            obj.missing = { field: fieldName };
            break;
          default:
            throw new Error('unexpected subtype ' + group.subType);
        }
        break;

      case 'number':
        obj.range = {};
        obj.range[fieldName] = {};
        obj.range[fieldName][group.subType] = group.value;
        break;

      case 'date':
        if (!group.subType) return;

        switch (group.subType) {
          case 'equals':
            if (!angular.isDate(group.date)) return;
            obj.term = {};
            obj.term[fieldName] = formatDate($filter, group.date, group.dateFormat);
            break;
          case 'lt':
          case 'lte':
            if (!angular.isDate(group.date)) return;
            obj.range = {};
            obj.range[fieldName] = {};
            obj.range[fieldName][group.subType] = formatDate($filter, group.date, group.dateFormat);
            break;
          case 'gt':
          case 'gte':
            if (!angular.isDate(group.date)) return;
            obj.range = {};
            obj.range[fieldName] = {};
            obj.range[fieldName][group.subType] = formatDate($filter, group.date, group.dateFormat);
            break;
          case 'last':
            if (!angular.isNumber(group.value)) return;
            obj.range = {};
            obj.range[fieldName] = {};
            obj.range[fieldName].gte = 'now-' + group.value + 'd';
            obj.range[fieldName].lte = 'now';
            break;
          case 'next':
            if (!angular.isNumber(group.value)) return;
            obj.range = {};
            obj.range[fieldName] = {};
            obj.range[fieldName].gte = 'now';
            obj.range[fieldName].lte = 'now+' + group.value + 'd';
            break;
          case 'exists':
            obj.exists = { field: fieldName };
            break;
          case 'notExists':
            obj.missing = { field: fieldName };
            break;
          default:
            throw new Error('unexpected subtype ' + group.subType);
        }
        break;

      case 'multi':
        obj.terms = {};
        obj.terms[fieldName] = Object.keys(group.values || {}).reduce(function(prev, key) {
          if (group.values[key]) prev.push(key);

          return prev;
        }, []);
        break;

      default:
        throw new Error('unexpected type');
    }

    return obj;
  }

  function getFilterTemplate(type) {
    var templates = {
      group: {
        type: 'group',
        subType: '',
        rules: [],
      },
      item: {
        field: '',
        subType: '',
        value: '',
      },
      number: {
        field: '',
        subType: '',
        value: null,
      },
    };

    return angular.copy(templates[type]);
  }

  function formatDate($filter, date, dateFormat) {
    if (!angular.isDate(date)) return false;
    var fDate = $filter('date')(date, dateFormat);
    return fDate;
  }

})(window.angular);
