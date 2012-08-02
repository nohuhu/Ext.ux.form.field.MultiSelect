/*
 * Universal multiple item selection picker
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

Ext.define('Ext.ux.picker.MultiSelect', {
    extend: 'Ext.Component',
    alias:  'widget.multiselectpicker',
    
    alternateClassName: [ 'Ext.picker.MultiSelect', 'Ext.MultiSelectPicker' ],
    
    requires: [
        'Ext.util.KeyNav',
        'Ext.data.Store',
        'Ext.button.Button',
        'Ext.grid.Panel'
    ],
    
    childEls: [
        'bodyEl', 'selectorListEl', 'footerEl', 'selectedListEl', 'selectedNoEl', 'removeAllEl'
    ],
    
    renderTpl: [
        '<div id="{id}-bodyEl">',
            '<div class="{baseCls}-header">',
                '<div class="{baseCls}-header-item-selector">{searchItems}</div>',
                '<tpl if="multiValue">',
                    '<div class="{baseCls}-header-item-selected"><span id="{id}-selectedNoEl">{selectedNo}</span> {selected} <a id="{id}-removeAllEl" href="#" role="button">{removeAll}</a></div>',
                '</tpl>',
            '</div>',
            '<div>',
                '<div id="{id}-selectorListEl" class="{baseCls}-selector-list">{%',
                    'var selectorGrid = values.$comp.selectorGrid;',
                    
                    'selectorGrid.ownerLayout = values.$comp.componentLayout;',
                    'selectorGrid.ownerCt     = values.$comp;',
                    
                    'Ext.DomHelper.generateMarkup(selectorGrid.getRenderTree(), out);',
                '%}</div>',
                '<tpl if="multiValue">',
                    '<div class="{baseCls}-divider"></div>',
                    '<div id="{id}-selectedListEl" class="{baseCls}-selected-list">{%',
                        'var selectedGrid = values.$comp.selectedGrid;',
                        
                        'selectedGrid.ownerLayout = values.$comp.componentLayout;',
                        'selectedGrid.ownerCt     = values.$comp;',
                        
                        'Ext.DomHelper.generateMarkup(selectedGrid.getRenderTree(), out);',
                    '%}</div>',
                '</tpl>',
            '</div>',
            '<div id="{id}-footerEl" class="{baseCls}-buttons-{multiSuffix}">{%',
                    'var okBtn        = values.$comp.okBtn,',
                        'cancelBtn    = values.$comp.cancelBtn,',
                        'clearBtn     = values.$comp.clearBtn;',
                
                'okBtn.ownerLayout = cancelBtn.ownerLayout = values.$comp.componentLayout;',
                'okBtn.ownerCt     = cancelBtn.ownerCt     = values.$comp;',

                'Ext.DomHelper.generateMarkup(okBtn.getRenderTree(), out);',
                'Ext.DomHelper.generateMarkup(cancelBtn.getRenderTree(), out);',
                
                'if ( clearBtn ) {',
                    'clearBtn.ownerLayout = values.$comp.componentLayout;',
                    'clearBtn.ownerCt     = values.$comp;',
                    
                    'Ext.DomHelper.generateMarkup(clearBtn.getRenderTree(), out);',
                '}',
            '%}</div>',
        '</div>'
    ],
    
    baseCls: 'ux-selectorpicker',
    
    minWidth:  202,
    minHeight: 256,
    
    initComponent: function() {
        var me = this;
        
        if ( me.multiValue ) {
            me.minWidth *= 2;
        };
        
        me.callParent();
        
        me.addEvents(
            /**
             * @event select
             * Fires when selection is complete
             * @param {Ext.ux.picker.MultiSelect} this MultiSelect picker
             * @param {Array} Selected items
             */
            'select'
        );
        
        me.createSelectorStore();
        
        if ( me.multiValue ) {
            me.createSelectedStore();
        };
        
        me.createButtons();
        me.createGrids();
    },
    
    beforeRender: function() {
        var me = this;
        
        me.callParent();
        
        Ext.applyIf(me, {
            renderData: {}
        });
        
        Ext.apply(me.renderData, {
            multiValue:  me.multiValue,
            multiSuffix: me.multiValue ? 'multi'            : 'single',
            searchItems: me.multiValue ? me.searchItemsText : me.selectItemText,
            selectedNo:  0,
            selected:    me.selectedText,
            removeAll:   me.removeAllText
        });
    },
    
    afterRender: function() {
        var me = this,
            handler, view;
        
        me.callParent();
        
        handler = Ext.bind(me.onGridSpecialKey, me, [ me.selectorGrid ], true);
        
        me.selectorKeyNav = new Ext.util.KeyNav(me.selectorGrid.getView().getEl(), {
            enter:     handler,
            del:       handler,
            backspace: handler
        });
        
        view = me.selectorGrid.getView();
        
        if ( !view.firstRefreshDone ) {
            view.refresh();
        };
        
        if ( me.multiValue ) {
            handler = Ext.bind(me.onGridSpecialKey, me, [ me.selectedGrid ], true);
    
            me.selectedKeyNav = new Ext.util.KeyNav(me.selectedGrid.getView().getEl(), {
                enter:     handler,
                del:       handler,
                backspace: handler
            });
            
            // Fix selectedGrid not rendering
            view = me.selectedGrid.getView();
            
            if ( !view.firstRefreshDone ) {
                view.refresh();
            };
        };
    },
    
    finishRenderChildren: function() {
        var me = this;
        
        me.okBtn.finishRender();
        me.cancelBtn.finishRender();
        me.selectorGrid.finishRender();
        
        if ( me.multiValue ) {
            me.clearBtn.finishRender();
            me.selectedGrid.finishRender();
        };
    },
    
    createButtons: function() {
        var me = this;
        
        me.okBtn = me.createButton({
            text:     me.okText,
            tooltip:  me.okTooltip,
            handler:  me.onOkClick,
            scope:    me,
            tabIndex: 1003,
            componentCls: 'ux-selectorpicker-button'
        });
        
        me.cancelBtn = me.createButton({
            text:     me.cancelText,
            tooltip:  me.cancelTooltip,
            handler:  me.onCancelClick,
            scope:    me,
            tabIndex: 1004,
            componentCls: 'ux-selectorpicker-button'
        });
        
        if ( me.multiValue ) {
            me.clearBtn = me.createButton({
                text:     me.clearText,
                tooltip:  me.clearTooltip,
                handler:  me.onClearClick,
                scope:    me,
                tabIndex: 1005,
                componentCls: 'ux-selectorpicker-button'
            });
        };
    },
    
    createButton: function(params) {
        return new Ext.button.Button(params);
    },
    
    createSelectorStore: function() {
        var me = this,
            storeConfig = me.storeConfig;
        
        // It is entirely possible that we're passed an already
        // instantiated Store object
        if ( Ext.isObject(storeConfig) && Ext.getClassName(storeConfig) == 'Ext.data.Store' ) {
            me.selectorStore       = storeConfig;
            me.selectorStoreLoaded = true;
        }
        else {
            me.selectorStore = new Ext.data.Store(storeConfig);
            
            if ( me.selectorStore.getCount() === 0 ) {
                me.selectorStore.on('load', function() {
                    me.selectorStoreLoaded = true;
                });
            }
            else {
                me.selectorStoreLoaded = true;
            };
        };
    },
    
    createSelectedStore: function() {
        var me = this,
            store = me.selectorStore,
            model, sorters;
        
        // Selected store mirrors Selector store and depends on it
        if ( !store )
            Ext.Error.raise('selectorStore is not initialized');
        
        model   = Ext.clone(store.model);
        sorters = Ext.Array.map(store.sorters.getRange(), function(item) {
            return Ext.clone(item);
        });
        
        me.selectedStore = new Ext.data.Store({
            model: model,
            proxy: {
                type: 'memory'
            },
            sorters: sorters
        });
    },
    
    createGrids: function() {
        var me      = this,
            columns = me.columnConfig,
            listeners;
        
        listeners = {
            itemdblclick: function(view, record, item, index, e) {
                this.onEnter(e, index, view.panel);
            },
            scope: me
        };
        
        if ( me.multiValue ) {
            columns.unshift({
                width:    20,
                renderer: me.renderIcon
            });
            
            Ext.apply(listeners, {
                itemclick:    me.onGridItemClick,
                afterrender:  function(grid) {
                    var view = grid.getView();
                    
                    view.getEl().set({
                        tabIndex: grid.tabIndex,
                        onfocus: 
                            'var grid = Ext.getCmp(\'' + grid.id + '\');' +
                            'var sel = grid.getSelectionModel(); ' +
                            'grid.picker.currentGrid = grid;' +
                            'if ( sel.getLastSelected() ) { sel.select( sel.getLastSelected() ) } ' +
                            'else if ( grid.store.count() > 0 ) { sel.select(0); };',
                        onblur:
                            'var sel = Ext.getCmp(\'' + grid.id + 
                            '\').getSelectionModel(); sel.deselectAll();'
                    });
                },
                beforedestroy: function(grid) {
                    var view = grid.getView();
                    
                    view.getEl().set({
                        onfocus: null,
                        onblur: null
                    });
                }
            });
        };
        
        me.selectorGrid = me.createGrid({
            store:       me.selectorStore,
            columns:     columns,
            width:       me.multiValue ? 201 : 202,
            height:      200,
            frame:       false,
            border:      false,
            bodyPadding: 0,
            hideHeaders: true,
            picker:      me,
            rowIcon:     'plus',
            tabIndex:    1001,
            listeners:   listeners
        });
        
        if ( !me.multiValue ) return;
        
        me.selectedGrid = me.createGrid({
            store:       me.selectedStore,
            columns:     columns,
            width:       me.multiValue ? 201 : 202,
            height:      200,
            frame:       false,
            border:      false,
            bodyPadding: 0,
            hideHeaders: true,
            picker:      me,
            rowIcon:     'minus',
            tabIndex:    1002,
            emptyText:   me.noneSelectedText,
            listeners: {
                itemclick: me.onGridItemClick,
                afterrender: function(grid) {
                    var view = grid.getView();
                    
                    view.getEl().set({
                        tabIndex: grid.tabIndex,
                        onfocus: 
                            'var grid = Ext.getCmp(\'' + grid.id + '\');' +
                            'var sel = grid.getSelectionModel(); ' +
                            'grid.picker.currentGrid = grid;' +
                            'if ( sel.getLastSelected() ) { sel.select( sel.getLastSelected() ) } ' +
                            'else if ( grid.store.count() > 0 ) { sel.select(0); }',
                        onblur:
                            'var sel = Ext.getCmp(\'' + grid.id + 
                            '\').getSelectionModel(); sel.deselectAll();'
                    });
                },
                beforedestroy: function(grid) {
                    var view = grid.getView();
                    
                    view.getEl().set({
                        onfocus: null,
                        onblur: null
                    });
                },
                itemdblclick: function(view, record, item, index, e) {
                    this.onEnter(e, index, view.panel);
                },
                scope: me
            }
        });
    },
    
    createGrid: function(params) {
        return new Ext.grid.Panel(params);
    },
    
    initEvents: function() {
        var me = this;
        
        me.callParent();
        
        if ( me.multiValue ) {
            me.mon(me.removeAllEl, 'click', me.clearSelection, me);
        };
    },
    
    renderIcon: function(value, metaData, record, rowIndex, colIndex, store, view) {
        var me = this;      // Grid panel
        
        metaData.style = "; padding-right: 0;";
        
        return Ext.String.format(
            '<div class="ux-selectorpicker-row-{0}" role="button"></div>',
            me.rowIcon
        );
    },
    
    /**
     * @private
     * Does whatever initialization is necessary upon picker expansion
     */
    onExpand: function() {
        var me = this,
            sel;
        
        me.currentGrid = me.selectorGrid;
        
        sel = me.selectorGrid.getSelectionModel();
        
        if ( !sel.hasSelection() && me.selectorGrid.store.getCount() > 0 )
            sel.select(0);
    },
    
    onGridItemClick: function(view, record, item, index, event) {
        var me = this,
            plusCls, minusCls, el;
        
        el = new Ext.Element( event.getTarget() );
        
        plusCls  = me.baseCls + '-row-plus';
        minusCls = me.baseCls + '-row-minus';
        
        if ( el ) {
            if ( el.hasCls(plusCls) || el.query('.'+plusCls).length > 0 ) {
                me.addSelected(index);
            }
            else if ( el.hasCls(minusCls) || el.query('.'+minusCls).length > 0 ) {
                me.removeSelected(index);
            }
            else {
                view.select(record);
                view.focusRow(index);
            };
        };
        
        // Return focus back to input field
        if ( me.multiValue ) {
            me.pickerField.focus();
        };
    },
    
    addSelected: function(index) {
        var me = this,
            sFrom = me.selectorStore,
            sTo = me.selectedStore,
            record, rJson;
        
        record = sFrom.getAt(index);
        rJson  = Ext.JSON.encode(record.data);
        
        if ( sTo.findBy(function(r) { return Ext.JSON.encode(r.data) == rJson } ) == -1 )
            sTo.loadData( [record.data], true );
        
        me.updateSelectedNo();
    },
    
    removeSelected: function(index) {
        var me = this,
            store, model;
        
        store = me.selectedStore;
        model = me.selectedGrid.getSelectionModel();
        
        store.removeAt(index);
        
        while ( index >= 0 && !store.getAt(index) ) index--;
        if ( index >= 0 ) model.select(index);
        
        me.updateSelectedNo();
    },
    
    updateSelectedNo: function() {
        var me = this;
        
        me.selectedNoEl.dom.innerHTML = me.selectedStore.count();
    },
    
    getCurrentGrid: function() {
        var me = this;
        
        return me.multiValue ? me.selectorGrid
             :                 me.currentGrid || (me.currentGrid = me.selectorGrid)
             ;
    },
    
    onUpArrow: function(e) {
        var me = this,
            grid, view, sel;

        grid = me.selectorGrid;
        view = grid.getView();
        sel  = view.getSelectionModel();

        // XXX This is an ugly hack
        e.target = e.currentTarget = view.getTargetEl().dom;
        sel.onKeyUp(e);

        return true;
    },
    
    onDownArrow: function(e) {
        var me = this,
            grid, view, sel;
        
        grid = me.selectorGrid;
        view = grid.getView();
        sel  = view.getSelectionModel();

        // XXX This is an ugly hack
        e.target = e.currentTarget = view.getTargetEl().dom;
        sel.onKeyDown(e);
        
        return true;
    },
    
    onEnter: function(e, idx, panel) {
        var me = this,
            grid, sel, record;
        
        if ( e.ctrlKey ) {
            me.onOkClick();
            e.stopEvent(e);
            
            return true;
        };

        grid = panel || me.getCurrentGrid();
        sel = grid.getSelectionModel().getSelection();
        
        if ( idx !== undefined || (sel && sel.length > 0) ) {
            var index = idx !== undefined ? idx : grid.store.indexOf( sel[0] );
            
            if ( grid == me.selectorGrid ) {
                if ( me.multiValue ) {
                    me.addSelected(index);
                }
                else {
                    me.onOkClick();
                };
            }
            else {
                me.removeSelected(index);
            };
            
            e.stopEvent(e);
            return true;
        };
        
        return false;
    },
    
    onGridSpecialKey: function(e, grid) {
        var me = this;  // Picker
        
        switch ( e.getKey() ) {
        case e.ENTER:
            e.ctrlKey ? me.onOkClick() : me.onEnter(e, undefined, grid);
            break;
        case e.BACKSPACE:
        case e.DELETE:
            if ( e.ctrlKey ) {
                me.clearSelection();
            }
            else if ( me.getCurrentGrid() == me.selectedGrid ) {
                // For selectedGrid, Enter and Backspace/Delete are similar
                // unless it's single value mode
                if ( me.multiValue ) {
                    me.onEnter(e);  
                };
            };
            break;
        }
    },
    
    clearSelection: function() {
        var me = this,
            grid = me.selectedGrid;
        
        if ( !me.multiValue ) return;
        
        grid.store.removeAll();
        me.updateSelectedNo();
    },
    
    /**
     * @private
     * Unselects any items in both selector and selected grids,
     * to avoid selection jumping visibly upon picker re-activation.
     */
    resetSelection: function() {
        var me = this;
        
        me.selectorGrid.getSelectionModel().deselectAll();
        
        if ( me.multiValue ) {
            me.selectedGrid.getSelectionModel().deselectAll();
        };
    },
    
    setFilter: function(value) {
        var me = this,
            regex;
        
        if ( value === undefined ) return;
        
        // Null means clear filter
        if ( value === null ) {
            me.selectorStore.filterBy(function() { return true; });
            return;
        };
        
        // Ugh. This here is another ugly kludge
        var pattern, parts;
        
        pattern = value.replace(/ /g, '<space>');       // This is to avoid escaping whitespace
        pattern = XRegExp.escape(pattern);              // ... by XRegExp.escape()
        pattern = pattern.replace(/<space>/g, ' ');     // Return spaces back
        
        parts   = pattern.split(/[ ]+/);                // Get the parts of the query
        parts   = Ext.Array.map(parts, function(p) {
            return '(' + p + ')';
        });                                             // Enclose in capture brackets
        
        pattern = parts.join('.*?');                    // Finally, recreate the pattern
        
        regex = new XRegExp(pattern, 'is');
        
        me.selectorStore.filterBy(function(record, id) {
            var str = '',
                keys = Ext.Object.getKeys(record.data);
            
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                str += (i ? ' ' : '') + record.get( keys[i] );
            };
            
            return regex.test(str);
        });
        
        if ( me.multiValue && me.selectorStore.count() > 0 )
            me.selectorGrid.getSelectionModel().select(0);
    },
    
    setValue: function(values) {
        var me    = this,
            field = me.idField,
            store = me.selectorStore,
            grid  = me.selectorGrid,
            index;
        
        if ( !values || !Ext.isArray(values) ) return;
        
        for ( var i = 0, l = values.length; i < l; i++ ) {
            index = store.findExact(field, values[i]);
            
            // In single mode, there should not be more than one value anyway
            if ( index > -1 ) {
                if ( me.multiValue ) {
                    me.addSelected(index);
                }
                else {
                    grid.getSelectionModel().select(index);
                };
            };
        };
    },
    
    onOkClick: function() {
        var me          = this,
            returnField = me.returnField,
            result;
            
        if ( me.multiValue ) {
            result = me.selectedStore.getRange();
        }
        else {
            result = me.selectorGrid.getSelectionModel().getSelection();
            result = result.length > 0 ? result
                   :                     [ '' ]
                   ;
        };
        
        me.clearSelection();
        me.resetSelection();

        me.fireEvent('select', me, result);
    },
    
    onCancelClick: function() {
        var me = this;
        
        me.clearSelection();
        me.resetSelection();
        
        me.fireEvent('cancel', me);
    },
    
    onClearClick: function() {
        var me = this;
        
        me.clearSelection();
        me.resetSelection();
        
        me.fireEvent('clear', me);
    },
    
    destroy: function() {
        var me = this;
        
        if ( me.rendered ) {
            if ( me.multiValue ) {
                Ext.destroy(
                    me.selectedStore,
                    me.selectedGrid,
                    me.selectedKeyNav,
                    me.clearBtn,
                    me.selectedListEl,
                    me.selectedNoEl,
                    me.removeAllEl
                );
            };

            Ext.destroy(
                me.selectorStore,
                me.selectorGrid,
                me.selectorKeyNav,
                me.okBtn,
                me.cancelBtn,
                me.bodyEl,
                me.selectorListEl,
                me.footerEl
            );
        };
        
        me.callParent();
    }
});