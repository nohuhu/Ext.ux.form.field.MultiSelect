/*
 * Input field that allows entering multiple values of arbitrary type, with drop-down picker.
 *
 * Version 0.99, compatible with Ext JS 4.1.
 *  
 * Copyright (c) 2011-2012 Alexander Tokarev.
 *  
 * Usage: See demo application.
 *
 * This code is licensed under the terms of the Open Source LGPL 3.0 license.
 * Commercial use is permitted to the extent that the code/component(s) do NOT
 * become part of another Open Source or Commercially licensed development library
 * or toolkit without explicit permission.
 * 
 * License details: http://www.gnu.org/licenses/lgpl.html
 */

Ext.define('Ext.ux.form.field.MultiSelect', {
    extend: 'Ext.form.field.Picker',
    alias:  [ 'widget.multiselect', 'widget.multiselectfield' ],
    
    requires: [ 'Ext.ux.picker.MultiSelect' ],
    
    mixins: {
        multivalue: 'Ext.ux.form.field.MultiValue'
    },
    
    /**
     * @cfg {String} multiDisabledText
     * Error text to display when multiple values are entered while multiValue is false.
     */
    multiDisabledText: 'Multiple values are not allowed',
    
    /**
     * @cfg {String} invalidRangeText
     * Error text to display when invalid item range is entered.
     */
    invalidRangeText: '{0} is not a valid range',
    
    /**
     * @cfg {String} invalidRangeEndsText
     * Error text to display when range end is less than range start.
     */
    invalidRangeEndsText: '{0} is invalid: start item must be less than end item',
    
    /**
     * @cfg {String} okText OK button text
     */
    okText: 'OK',
    
    /**
     * @cfg {String} okTooltip OK button tooltip
     */
    okTooltip: 'Confirm selection ' + (Ext.isMac ? '(⌘-Enter)' : '(Ctrl-Enter)'),
    
    /**
     * @cfg {String} cancelText Cancel button text
     */
    cancelText: 'Cancel',
    
    /**
     * @cfg {String} cancelTooltip Cancel button tooltip
     */
    cancelTooltip: 'Cancel selection (Esc)',
    
    /**
     * @cfg {String} clearText Clear button text
     */
    clearText: 'Clear',
    
    /**
     * @cfg {String} clearTooltip Clear button tooltip
     */
    clearTooltip: 'Clear selection ' + (Ext.isMac ? '(⌘-Delete)' : '(Ctrl-Delete)'),
    
    /**
     * @cfg {String} searchItemsText Hint to display in upper left corner of the picker
     * when multiple values are allowed.
     */
    searchItemsText: 'Type to search items:',
    
    /**
     * @cfg {String} selectItemText Hint to display in upper left corner of the picker
     * when multiple values are not allowed.
     */
    selectItemText: 'Select one item:',
    
    /**
     * @cfg {String} selectedText A chunk of text meaning 'selected', to use in picker template
     * when multiple values are allowed.
     */
    selectedText: 'selected',
    
    /**
     * @cfg {String} noneSelectedText Text to show in rightmost Grid when no items
     * are selected in multiple selection mode. Default: ''
     */
    
    /**
     * @cfg {String} removeAllText Text to place in upper right corner of the picker
     * when multiple values are allowed.
     */
    removeAllText: 'Remove all',
    
    /**
     * @cfg {Object} store Defines the store containing items to be displayed in selector Grid
     */
    store: {
        fields: [ 'data' ],
        proxy:  { type: 'memory' }
    },
    
    /*
     * @cfg {String} returnField This field will be extracted from selected Store data
     * to be submitted as the input
     */
    returnField: 'id',
    
    /**
     * @cfg {Function} itemSortFn Sorter function to be used with input values when
     * they're being collapsed in ranges.
     */
    itemSortFn: undefined,
    
    triggerCls: Ext.baseCSSPrefix + 'form-search-trigger',
    
    tabIndex: 1000,
    
    // inherit docs
    constructor: function(config) {
        var me = this;
        
        // Wrap listeners
        if ( config.listeners && config.listeners.specialkey ) {
            config.savedSpecialKey = {
                fn:    config.listeners.specialkey,
                scope: config.listeners.scope || me
            };
            config.listeners.specialkey = me.onSpecialKey;
        }
        else {
            config.listeners = config.listeners || {};
            Ext.apply(config.listeners, {
                specialKey: me.onSpecialKey
            });
        };
        config.listeners.scope = me;
        
        Ext.apply(me, config);
        
        me.callParent(arguments);
    },
    
    // inherit docs
    initEvents: function() {
        var me = this;
        
        me.callParent();
        
        // Replacing original keyboard navigation settings
        Ext.destroy(me.keyNav);
        me.keyMap = me.initKeyMap();
        
        me.on('change', me.setPickerFilter, me);
    },
    
    /**
     * @private Initializes keyboard map used to navigate across picker Grids
     */
    initKeyMap: function() {
        var me = this;
        
        return new Ext.util.KeyMap(me.inputEl, [{
            key:   Ext.EventObject.DOWN,
            fn:    me.onDownArrow,
            scope: me
        }, {
            key:   Ext.EventObject.UP,
            fn:    me.onUpArrow,
            scope: me
        }, {
            key:   Ext.EventObject.ESC,
            fn:    me.onCancel,
            scope: me
        }, {
            key:   Ext.EventObject.DELETE,
            ctrl:  true,
            fn:    me.onClear,
            scope: me
        }]);
    },
    
    // inherit docs
    createPicker: function() {
        var me = this;
        
        return new Ext.ux.picker.MultiSelect({
            pickerField:      me,
            ownerCt:          me.ownerCt,
            renderTo:         document.body,
            floating:         true,
            hidden:           true,
            focusOnShow:      true,
            okText:           me.okText,
            okTooltip:        me.okTooltip,
            cancelText:       me.cancelText,
            cancelTooltip:    me.cancelTooltip,
            clearText:        me.clearText,
            clearTooltip:     me.clearTooltip,
            searchItemsText:  me.searchItemsText,
            selectItemText:   me.selectItemText,
            selectedText:     me.selectedText,
            noneSelectedText: me.noneSelectedText,
            removeAllText:    me.removeAllText,
            idField:          me.returnField,
            multiValue:       me.multiValue,
            storeConfig:      me.store,
            columnConfig:     me.columns,
            listeners: {
                scope:  me,
                select: function(picker, records) {
                    var me = this;
                    
                    me.onSelect(picker, records);
                    me.collapse();
                    me.focus();
                },
                cancel: function() { me.collapse(); me.focus(); }
            }
        });
    },
    
    /*
     * @private Performs picker initialization/cleanup upon expanding
     */
    onExpand: function() {
        var me     = this,
            picker = me.picker,
            text, values, _setValue;
        
        text = me.getRawValue();
        
        // We don't care for invalid input
        if ( me.isValid() ) {
            values = me.expandValues(text);
            
            if ( picker.selectorStoreLoaded ) {
                picker.setValue(values);
            }
            else {
                _setValue = function() {
                    picker.selectorStore.un('load', _setValue);
                    picker.setValue(values);
                }
                
                picker.selectorStore.on('load', _setValue);
            };
            
            // This is to prevent filtering to happen
            me.oldRawValue = me.getRawValue();
            me.setRawValue('');
            me.clearInvalid();
        }
        else if ( text === '' ) {
            me.clearInvalid();
        };
        
        picker.onExpand();
        
        if ( me.multiValue ) {
            me.setPickerFilter();
        };
    },
    
    onSelect: function(picker, records) {
        var me    = this,
            field = me.returnField,
            result, collapsed, text;
        
        result = Ext.Array.map( records || [], function(item) {
            return item ? item.get(field) : '';
        });
        
        collapsed = me.collapseRange(result);
        text      = me.formatDisplay(collapsed);
        
        me.setRawValue(text);
        
        // Ensure new values are validated
        me.isValid();
        
        me.fireEvent('select', me, text);
        
        me.dontSetOldValue = true;
        me.collapse();
        delete me.dontSetOldValue;
    },

    onCancel: function() {
        var me = this;

        me.getPicker().onCancelClick();
        me.collapse();
    },

    onCollapse: function() {
        var me = this;

        if ( me.getRawValue() === '' && !me.dontSetOldValue ) {
            me.setRawValue(me.oldRawValue || '');
            me.isValid();                           // Ensure it's validated
            me.oldRawValue = '';
        };
    },
    
    getErrors: function(values) {
        var me     = this,
            multi  = me.multiValue,
            vsep   = me.valueSeparatorRE,
            rsep   = me.rangeSeparatorRE,
            errors = [],
            matches, range, isValid;
        
        // If picker is activated, avoid checking errors at all
        if ( me.isExpanded ) return [];

        if ( values === null || values.length < 1 ) {
            if ( !me.allowBlank ) {
                errors.push(me.blankText);
            };
            
            return errors;
        };
        
        if ( !multi && values.match(vsep) ) {
            errors.push(me.multiDisabledText);
        };
        
        matches = me.splitValues(values, vsep);
        
        MATCHES:
        for ( var i = 0, l = matches.length; i < l; i++ ) {
            var item = matches[i];
            
            if ( !multi && item.match(rsep) ) {
                errors.push(me.multiDisabledText);
                break;
            };
        
            range = me.splitValues(item, rsep);
            
            if ( range.length > 1 ) {       // Got item range
                isValid = me.validateRange(range);
            }
            else {
                isValid = me.validateItem( range[0] );
            };

            if ( isValid !== true ) {
                errors.push(isValid);
            };
        };
        
        errors.concat( me.callParent(arguments) );
        
        return errors;
    },
    
    /**
     * @private Validates range of items, returns true or error string
     * @param {Array} range Range of items to validate
     */
    validateRange: function(range) {
        var me = this,
            rsep = me.displayRangeSeparator,
            fmt  = Ext.String.format,
            start, end, isValid = false;
        
        // Very basic validation for now
        try {
            start = range[0];
            end   = range[1];
        } catch (e) {};
        
        if ( Ext.isEmpty(start) || Ext.isEmpty(end) ) {
            return fmt(me.invalidRangeText, me.formatDisplayRange(range, rsep));
        };
        
        isValid = me.validateItem(start);
        
        if ( isValid !== true ) return isValid;
        
        isValid = me.validateItem(end);
        
        if ( isValid !== true ) return isValid;
        
        if ( start > end ) {
            return fmt(me.invalidRangeEndsText, me.formatDisplayRange(range, rsep));
        };
        
        return true;
    },
    
    /**
     * @private Validates single value, returns true or false
     * @param {Mixed} value Value to validate
     */
    validateItem: function(value) {
        var me = this;
        
        return !Ext.isEmpty(value) ||
               Ext.String.format(me.invalidText, value);
    },
    
    onUpArrow: function(keyCode, e) {
        var me = this;
        
        if ( me.isExpanded ) me.getPicker().onUpArrow(e);
    },
    
    onDownArrow: function(keyCode, e) {
        var me = this;

        if ( me.isExpanded ) {
            me.getPicker().onDownArrow(e);
        }
        else {
            me.onTriggerClick();
        };
    },
    
    onEnter: function(e) {
        var me = this,
            picker, values;
        
        // When picker is expanded, always handle Enter
        if ( !me.isExpanded ) return false;
        
        // Picker gets the first shot
        picker = me.getPicker();
        if ( picker.onEnter(e) ) {
            me.inputEl.focus();
            return true;
        };
        
        // Invalid input may mean user's typing something and pressed Enter accidentally
        if ( !me.isValid() ) return true;
        
        // Or user could have typed something that picker didn't understand
        values = me.expandValues(me.getRawValue());
        
        // No values? Hmm.
        if ( Ext.isEmpty(values) ) return true;
        
        // Got something - probably a range of items (picker doesn't handle that)
        if ( me.multiValue ) {
            picker.setFilter(null);
            picker.setValue(values);
        }
        else {
            picker.setValue(Ext.Array.from(values[0]));
        };
            
        return true;
    },
    
    onClear: function(keyCode, e) {
        var me = this;

        // Ctrl-Delete and Ctrl-Backspace are only handled
        // with active picker
        if ( me.isExpanded && e.ctrlKey )
            me.getPicker().onClearClick(e);
    },
    
    onSpecialKey: function(field, e) {
        var me = this;
        
        // We need to protect Enter keystroke from propagating
        if ( e.getKey() === e.ENTER && me.onEnter(e) ) return;  // Means it was handled;
        
        // The same goes for Escape key -- if picker is expanded,
        // Esc should always mean "open it"
        if ( e.getKey() === e.ESC && me.isExpanded ) {
            e.stopEvent();
            me.onCancel();
            
            return;
        };
        
        if ( me.savedSpecialKey )
            me.savedSpecialKey.fn.call(me.savedSpecialKey.scope, field, e);
    },
    
    setPickerFilter: function(field) {
        var me = this,
            value;
        
        // Avoid setting filter on unexpanded picker
        if ( !me.isExpanded ) return;
        
        value = me.getValue();
        me.getPicker().setFilter(value);
    },
    
    expandValues: function(text) {
        var me = this,
            vsep = me.valueSeparatorRE,
            rsep = me.rangeSeparatorRE,
            values,
            result = [];
        
        if ( text === '' || text === null ) {
            return [];
        };
        
        values = me.splitValues(text, vsep);
        
        for ( var i = 0, l = values.length; i < l; i++ ) {
            var range = me.splitValues( values[i], rsep );
            
            // Ugh. What an ugliness!
            result = [].concat( result,
                                range.length > 1 ? me.expandRange(range) : range[0]
                              );
        };
        
        return result;
    },
    
    expandRange: function(range) {
        var me = this,
            pfx_xregex,
            pfx_start = '', start, end, current, parts,
            result = [];
        
        pfx_xregex = XRegExp('^ (?<prefix> [*#0]+ ) ', 'x');
        
        if ( parts = pfx_xregex.exec(range[0]) ) pfx_start = parts.prefix;
        
        start = range[0] - 0;
        end   = range[1] - 0;
        
        // This is potentially very fragile but I'm out of better ideas
        // at this point.
        for ( var i = 0, l = end - start; i < l; i++ ) {
            current = start + i;            // Numerical value
            current = pfx_start + current;  // Prefix gets added as a string
            result.push(current);
        };
        
        result.push(range[1]);
        
        return result;
    },

    /**
     * @private
     * Collapses item ranges. The code is adapted from Perl module Range::Object
     */
    collapseRange: function(data) {
        var me = this,
            range = Ext.clone(data),
            first, last,
            result = [];
        
        if ( Ext.isEmpty(data) ) {
            return result;
        };
        
        // Default is to sort as text (in case entered manually)
        range = Ext.Array.sort(range, me.itemSortFn);
        
        ITEM:
        for ( var i = 0, l = range.length; i < l; i++ ) {
            var item = range[i];
            
            // If first is defined, it means range has started
            if ( first === undefined ) {
                first = last = item;
                continue ITEM;
            };
            
            // If last immediately preceeds item in range,
            // item becomes next last
            if ( me.nextInRange(last, item) ) {
                last = item;
                continue ITEM;
            };
            
            // If item doesn't follow last and last is defined,
            // it means that current contiguous range is complete
            if ( !me.equalValues(first, last) ) {
                result.push( [first, last] );
                first = last = item;
                continue ITEM;
            };
            
            // If last wasn't defined, range was never contiguous
            result.push( first );
            first = last = item;
        };
        
        // We're here when last item has been processed
        if ( me.equalValues(first, last) ) {
            result.push( first );
        }
        else {
            result.push( [first, last] );
        };
        
        return result;
    },
    
    nextInRange: function(first, last) {
        var a = first - 0,      // JS is stupid.
            b = last  - 0;
        
        return b === (a + 1);
    },
    
    equalValues: function(first, last) {
        return first === last;
    },
    
    destroy: function() {
        var me = this;
        
        me.un('change', me.setPickerFilter);
        
        // This is to fool parent destroy()
        me.keyNav = new Ext.util.KeyNav(me.inputEl, {});
        
        me.callParent();
    }
});
