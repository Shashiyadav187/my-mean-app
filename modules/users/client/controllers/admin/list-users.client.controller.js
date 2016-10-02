(function () {
  'use strict';

  angular
    .module('users.admin')
    .controller('UserListController', UserListController);

  UserListController.$inject = ['$scope', '$filter', '$timeout', 'AdminService', 'Upload'];

  function UserListController($scope, $filter, $timeout, AdminService, Upload) {
    var vm = this;
    vm.buildPager = buildPager;
    vm.figureOutItemsToDisplay = figureOutItemsToDisplay;
    vm.pageChanged = pageChanged;
    vm.fileSelected = false;
    vm.csvFile = null;
    vm.bulkUserCreated = null;
    vm.createBulkUsers = createBulkUsers;

    AdminService.query(function (data) {
      vm.users = data;
      vm.buildPager();
    });

    function buildPager() {
      vm.pagedItems = [];
      vm.itemsPerPage = 15;
      vm.currentPage = 1;
      vm.figureOutItemsToDisplay();
    }

    function createBulkUsers() {
      vm.csvFile.upload = Upload.upload({
        url: '/api/users',
        method: 'POST',
        data: { file: vm.csvFile }
      })
      .then(function (response) {
        $timeout(function () {
          vm.bulkUserCreated = response.data;
          vm.fileSelected = null;
          vm.csvFile = null;
        });
      }, function (response) {
        if (response.status > 0)
          $scope.errorMsg = response.status + ': ' + response.data;
      }, function (evt) {
        vm.csvFile.uploadStatus = 'OK';
      });
    }

    function figureOutItemsToDisplay() {
      vm.filteredItems = $filter('filter')(vm.users, {
        $: vm.search
      });
      vm.filterLength = vm.filteredItems.length;
      var begin = ((vm.currentPage - 1) * vm.itemsPerPage);
      var end = begin + vm.itemsPerPage;
      vm.pagedItems = vm.filteredItems.slice(begin, end);
    }

    function pageChanged() {
      vm.figureOutItemsToDisplay();
    }
  }
}());
